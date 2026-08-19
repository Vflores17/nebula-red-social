import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ConfirmModal from "../components/ConfirmModal";
import InspectContentModal from "../components/InspectContentModal";
import { useAuth } from "../context/AuthContext";
import { deletePost, getPostByIdCached } from "../services/postService";
import { getAll as getReports, updateReport } from "../services/reportService";
import {
  deleteUser,
  getAll as getUsers,
  getProfileByIdCached,
} from "../services/userService";
import "./AdminPanel.css";

const formatearFecha = (createdAt) => {
  const fecha = createdAt?.toDate?.();
  return fecha
    ? fecha.toLocaleString("es-CR", { dateStyle: "medium", timeStyle: "short" })
    : "Fecha no disponible";
};

const formatearUsuario = (profile) => {
  const name = profile.nombrePlaneta || profile.nombre || "Usuario sin nombre";
  const handle = profile.handle || profile.username || profile.nombrePlaneta;
  return handle ? `${name} (@${handle})` : name;
};

const ResolvedUser = ({ uid }) => {
  const [result, setResult] = useState({ loading: true, text: "" });

  useEffect(() => {
    let active = true;

    const resolveUser = async () => {
      setResult({ loading: true, text: "" });
      try {
        const profile = await getProfileByIdCached(uid);
        if (!active) return;
        setResult({
          loading: false,
          text: profile ? formatearUsuario(profile) : "Usuario eliminado",
        });
      } catch (lookupError) {
        console.error("Error al resolver el usuario del reporte:", lookupError);
        if (active) setResult({ loading: false, text: "Usuario no disponible" });
      }
    };

    resolveUser();
    return () => { active = false; };
  }, [uid]);

  return result.loading ? "Cargando..." : result.text;
};

const ResolvedPost = ({ postId }) => {
  const [result, setResult] = useState({ loading: true, text: "" });

  useEffect(() => {
    let active = true;

    const resolvePost = async () => {
      setResult({ loading: true, text: "" });
      try {
        const post = await getPostByIdCached(postId);
        if (!active) return;

        if (!post) {
          setResult({ loading: false, text: "Publicación eliminada" });
          return;
        }

        const description = post.description?.trim() || "Publicación sin texto";
        const excerpt = description.length > 60
          ? `${description.slice(0, 60)}...`
          : description;
        setResult({ loading: false, text: `🚩 ${excerpt}` });
      } catch (lookupError) {
        console.error("Error al resolver el post reportado:", lookupError);
        if (active) setResult({ loading: false, text: "Publicación no disponible" });
      }
    };

    resolvePost();
    return () => { active = false; };
  }, [postId]);

  return result.loading ? "Cargando..." : result.text;
};

const ResolvedTarget = ({ report }) => (
  report.targetType === "user"
    ? <ResolvedUser uid={report.targetId} />
    : <ResolvedPost postId={report.targetId} />
);

const AdminPanel = () => {
  const { user, userProfile, loading } = useAuth();
  const currentRole = userProfile?.role ?? userProfile?.rol ?? "user";
  const [activeTab, setActiveTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [action, setAction] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [inspectTarget, setInspectTarget] = useState(null);

  useEffect(() => {
    if (loading || currentRole !== "admin") return;

    let active = true;
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [reportSnapshot, userSnapshot] = await Promise.all([
          getReports(),
          getUsers(),
        ]);
        if (!active) return;

        setReports(reportSnapshot.docs
          .map((document) => ({ id: document.id, ...document.data() }))
          .filter((report) => report.status === "pending"));
        setUsers(userSnapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        })));
      } catch (loadError) {
        console.error("Error al cargar el panel de administración:", loadError);
        if (active) setError("No se pudieron cargar los datos del panel.");
      } finally {
        if (active) setLoadingData(false);
      }
    };

    loadData();
    return () => { active = false; };
  }, [loading, currentRole]);

  if (loading) {
    return <p className="admin-access-loading">Cargando...</p>;
  }

  if (currentRole !== "admin") {
    return <Navigate to="/" replace />;
  }

  const closeAction = () => {
    if (!processing) setAction(null);
  };

  const processAction = async () => {
    if (!action) return;

    setProcessing(true);
    try {
      if (action.kind === "discard-report") {
        await updateReport(action.report.id, { status: "reviewed" });
        setReports((current) => current.filter((report) => report.id !== action.report.id));
      }

      if (action.kind === "delete-content") {
        if (action.report.targetType === "post") {
          await deletePost(action.report.targetId);
        } else if (action.report.targetType === "user") {
          await deleteUser(action.report.targetId);
          setUsers((current) => current.filter((account) => (
            (account.uid || account.id) !== action.report.targetId
          )));
        } else {
          throw new Error("Tipo de contenido reportado desconocido.");
        }

        await updateReport(action.report.id, { status: "reviewed" });
        setReports((current) => current.filter((report) => report.id !== action.report.id));
      }

      if (action.kind === "delete-user") {
        await deleteUser(action.account.id);
        setUsers((current) => current.filter((account) => account.id !== action.account.id));
      }

      setAction(null);
    } catch (actionError) {
      console.error("Error al procesar la acción administrativa:", actionError);
      setAction(null);
      setError("No se pudo completar la acción administrativa.");
    } finally {
      setProcessing(false);
    }
  };

  const actionCopy = action?.kind === "discard-report"
    ? {
        title: "¿Descartar este reporte?",
        message: "El reporte se marcará como revisado sin eliminar el contenido.",
        label: "Descartar",
        danger: false,
      }
    : action?.kind === "delete-content"
      ? {
          title: "¿Eliminar este contenido?",
          message: action.report.targetType === "user"
            ? "Se eliminará el documento del usuario de forma irreversible y el reporte quedará revisado."
            : "Se eliminará la publicación de forma irreversible y el reporte quedará revisado.",
          label: "Eliminar",
          danger: true,
        }
      : {
          title: "¿Eliminar esta cuenta?",
          message: "Esta acción es irreversible y eliminará el documento del usuario.",
          label: "Eliminar",
          danger: true,
        };

  return (
    <div className="admin-page">
      <Navbar />
      <main className="admin-panel">
        <h1>Panel de administración</h1>

        <div className="admin-tabs" role="tablist" aria-label="Secciones administrativas">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "reports"}
            className={activeTab === "reports" ? "active" : ""}
            onClick={() => setActiveTab("reports")}
          >
            Reportes pendientes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "users"}
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            Usuarios
          </button>
        </div>

        {loadingData ? (
          <p className="admin-empty">Cargando datos...</p>
        ) : activeTab === "reports" ? (
          <section className="admin-list" aria-label="Reportes pendientes">
            {reports.length === 0 ? (
              <p className="admin-empty">No hay reportes pendientes 🎉</p>
            ) : reports.map((report) => (
              <article className="admin-card" key={report.id}>
                <div className="admin-card-content">
                  <h2>{report.targetType === "post" ? "🚩 Post" : "👤 Usuario"}</h2>
                  <p>{report.reason}</p>
                  <dl className="admin-meta">
                    <div><dt>Reportado por</dt><dd><ResolvedUser uid={report.reporterId} /></dd></div>
                    <div><dt>Objetivo</dt><dd><ResolvedTarget report={report} /></dd></div>
                    <div><dt>Fecha</dt><dd>{formatearFecha(report.createdAt)}</dd></div>
                  </dl>
                </div>
                <div className="admin-card-actions">
                  <button
                    type="button"
                    onClick={() => setInspectTarget({
                      type: report.targetType,
                      id: report.targetId,
                    })}
                  >
                    👁️ Ver contenido
                  </button>
                  <button
                    type="button"
                    className="admin-danger-button"
                    onClick={() => setAction({ kind: "delete-content", report })}
                  >
                    Eliminar contenido
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction({ kind: "discard-report", report })}
                  >
                    Descartar reporte
                  </button>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="admin-list" aria-label="Usuarios">
            {users.length === 0 ? (
              <p className="admin-empty">No hay usuarios registrados.</p>
            ) : users.map((account) => {
              const accountUid = account.uid || account.id;
              return (
                <article className="admin-card" key={account.id}>
                  <div className="admin-card-content">
                    <h2>{account.nombrePlaneta || account.nombre || "Usuario sin nombre"}</h2>
                    <p>@{account.handle || account.username || account.nombrePlaneta || accountUid}</p>
                    <p className="admin-user-id">{accountUid}</p>
                  </div>
                  {accountUid !== user?.uid && (
                    <div className="admin-card-actions">
                      <button
                        type="button"
                        className="admin-danger-button"
                        onClick={() => setAction({ kind: "delete-user", account })}
                      >
                        Eliminar cuenta
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </main>

      <ConfirmModal
        isOpen={Boolean(action)}
        title={actionCopy.title}
        message={actionCopy.message}
        confirmLabel={actionCopy.label}
        danger={actionCopy.danger}
        loading={processing}
        onConfirm={processAction}
        onClose={closeAction}
      />

      <ConfirmModal
        isOpen={Boolean(error)}
        title="No se pudo completar la acción"
        message={error}
        confirmLabel="Entendido"
        cancelLabel=""
        onConfirm={() => setError("")}
        onClose={() => setError("")}
      />

      {inspectTarget && (
        <InspectContentModal
          targetType={inspectTarget.type}
          targetId={inspectTarget.id}
          onClose={() => setInspectTarget(null)}
        />
      )}
    </div>
  );
};

export default AdminPanel;
