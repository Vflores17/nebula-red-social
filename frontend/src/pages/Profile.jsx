import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProfileHeader from "../components/ProfileHeader";
import ProfileTabs from "../components/ProfileTabs";
import PostCard from "../components/PostCard";
import SuggestedPlanet from "../components/SuggestedPlanet";
import { profile as profileMock } from "../mocks/profile";
import { auth } from "../config/firebase";
import { getById as getUserById } from "../services/userService";
import { obtenerAmigos } from "../services/friendshipService";
import { useAuth } from "../context/AuthContext";
import { getAll, getById } from "../services/postService";
import { getRepostsByUser } from "../services/repostService";
import "./Profile.css";

const Profile = () => {
  const { uid: uidDeLaRuta } = useParams();
  const [activeTab, setActiveTab] = useState("transmisiones");
  const [misPosts, setMisPosts] = useState([]);
  const [userProfileState, setUserProfileState] = useState(profileMock); // fallback mientras carga
  const [amigos, setAmigos] = useState([]);
  const [cargandoAmigos, setCargandoAmigos] = useState(true);
  const [perfilNoEncontrado, setPerfilNoEncontrado] = useState(false);
  const { user, userProfile } = useAuth();

  const currentUserId = auth.currentUser?.uid || user?.uid;
  // Si la ruta trae un :uid (/perfil/:uid) mostramos ese perfil ajeno;
  // si no, mostramos el perfil del usuario logueado (/perfil).
  const targetUserId = uidDeLaRuta || currentUserId;
  const esPropio = !uidDeLaRuta || uidDeLaRuta === currentUserId;

  // 1. Cargar el perfil REAL del usuario objetivo (propio o ajeno)
  useEffect(() => {
    if (!targetUserId) return;

    const cargarPerfil = async () => {
      setPerfilNoEncontrado(false);
      try {
        const amigosIds = await obtenerAmigos(targetUserId);
        const docSnap = await getUserById(targetUserId);
        const datos = docSnap?.data ? docSnap.data() : null;

        if (!datos) {
          if (!esPropio) {
            setPerfilNoEncontrado(true);
          } else if (userProfile) {
            setUserProfileState({
              uid: currentUserId,
              username: userProfile?.handle || userProfile?.username || "explorador",
              displayName: userProfile?.nombrePlaneta || "Explorador",
              avatar: userProfile?.avatar || null,
              bio: userProfile?.biografia || "",
              location: userProfile?.ubicacion || "",
              joinedAt: userProfile?.createdAt?.toDate ? userProfile.createdAt.toDate().toLocaleDateString("es-CR", { month: "long", year: "numeric" }) : "",
              satellites: userProfile?.satellites || amigosIds.length,
              orbiting: userProfile?.orbiting || amigosIds.length,
            });
          }
          return;
        }

        setUserProfileState({
          uid: targetUserId,
          username: (datos?.nombrePlaneta || datos?.handle || "").toLowerCase().replace(/\s+/g, ""),
          displayName: datos?.nombrePlaneta || "Sin nombre",
          avatar: datos?.avatar || null,
          bio: datos?.biografia || "",
          location: datos?.ubicacion || "",
          joinedAt: datos?.createdAt?.toDate
            ? datos.createdAt.toDate().toLocaleDateString("es-ES", { month: "long", year: "numeric" })
            : "recientemente",
          satellites: amigosIds.length,
          orbiting: amigosIds.length,
        });
      } catch (error) {
        console.error("Error al cargar perfil:", error);
      }
    };

    cargarPerfil();
  }, [targetUserId, userProfile, esPropio, currentUserId]);

  // 2. Cargar los posts del perfil objetivo (propios + reposts) usando su uid
  useEffect(() => {
    if (!targetUserId) return;

    const cargarTodo = async () => {
      // 1. Posts creados directamente por el usuario objetivo
      const snapshot = await getAll();
      const todosLosPosts = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        esRepost: false,
      }));
      
      // Si el perfil es ajeno, filtramos los posts privados que no nos pertenecen
      const propios = todosLosPosts.filter((post) => {
        const esDelTarget = post.authorId === targetUserId;
        const puedeVerPrivado = post.visibility !== "private" || post.authorId === currentUserId;
        const puedeVerModerado = post.estado !== "pendiente" || post.authorId === currentUserId;

        return esDelTarget && puedeVerPrivado && puedeVerModerado;
      });

      // 2. Posts que retransmitió
      const repostsSnapshot = await getRepostsByUser(targetUserId);
      const repostsData = repostsSnapshot.docs.map((d) => d.data());

      const repostsConPost = await Promise.all(
        repostsData.map(async (repost) => {
          const postDoc = await getById(repost.originalPostId);
          if (!postDoc) return null;

          return {
            id: postDoc.id,
            ...postDoc.data(),
            esRepost: true,
            repostCreatedAt: repost.createdAt,
          };
        })
      );

      // filtramos los que pudieron salir null (post original borrado) o privados de otra persona
      const repostsValidos = repostsConPost.filter((post) => (
        post
          && (post.visibility !== "private" || post.authorId === currentUserId)
          && (post.estado !== "pendiente" || post.authorId === currentUserId)
      ));
      
      const combinado = [...propios, ...repostsValidos].sort((a, b) => {
        const fechaA = a.esRepost ? a.repostCreatedAt : a.createdAt;
        const fechaB = b.esRepost ? b.repostCreatedAt : b.createdAt;
        return (fechaB?.seconds || 0) - (fechaA?.seconds || 0);
      });

      setMisPosts(combinado);
    };

    cargarTodo();
  }, [targetUserId, currentUserId]);

  // 3. Cargar la lista de amigos del perfil objetivo con sus datos completos
  useEffect(() => {
    if (!targetUserId) return;

    const cargarAmigos = async () => {
      setCargandoAmigos(true);
      try {
        const amigosIds = await obtenerAmigos(targetUserId);

        const amigosConDatos = await Promise.all(
          amigosIds.map(async (uid) => {
            const docSnap = await getUserById(uid);
            const datos = docSnap?.data ? docSnap.data() : null;
            if (!datos) return null;

            return {
              uid,
              nombre: datos.nombrePlaneta || "Sin nombre",
              handle: (datos.nombrePlaneta || "").toLowerCase().replace(/\s+/g, ""),
              avatar: datos.avatar || "#9ca3af",
              bio: datos.biografia || "",
            };
          })
        );

        setAmigos(amigosConDatos.filter(Boolean));
      } catch (error) {
        console.error("Error al cargar amigos:", error);
      } finally {
        setCargandoAmigos(false);
      }
    };

    cargarAmigos();
  }, [targetUserId]);

  const handlePostEliminado = (postId) => {
    setMisPosts((postsActuales) => postsActuales.filter((post) => post.id !== postId));
  };

  if (perfilNoEncontrado) {
    return (
      <div className="planeta-page">
        <Navbar />
        <div className="planeta-content">
          <Link to="/" className="volver-link">
            ← Volver al Cosmos
          </Link>
          <p className="empty-state">Este planeta no existe o fue eliminado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="planeta-page">
      <Navbar />
      <div className="planeta-content">
        <Link to="/" className="volver-link">
          ← Volver al Cosmos
        </Link>

        <ProfileHeader
          profile={userProfileState}
          isOwnProfile={esPropio}
          onProfileUpdate={(datosActualizados) =>
            setUserProfileState((prev) => ({ ...prev, ...datosActualizados }))
          }
        />
        
        <ProfileTabs activeTab={activeTab} onChange={setActiveTab} />

        <div className="planeta-tab-content">
          {activeTab === "transmisiones" &&
            (misPosts.length === 0 ? (
              <p className="empty-state">No hay transmisiones aún</p>
            ) : (
              misPosts.map((post) => (
                <div key={post.esRepost ? `repost-${post.id}` : post.id}>
                  {post.esRepost && (
                    <p className="repost-label">🔁 Retransmitiste esto</p>
                  )}
                  <PostCard
                    id={post.id}
                    authorId={post.authorId}
                    nombre={post.nombre}
                    handle={post.handle}
                    avatar={post.avatar}
                    description={post.description}
                    image={post.image}
                    linkUrl={post.linkUrl}
                    timeAgo={post.createdAt?.toDate?.() || new Date()}
                    destellosNum={post.destellosNum}
                    commentsNum={post.commentsNum}
                    sharesNum={post.sharesNum}
                    visibility={post.visibility}
                    onPostEliminado={handlePostEliminado}
                  />
                </div>
              ))
            ))}

          {activeTab === "satelites" && (
            <div className="content-planets">
              {cargandoAmigos ? (
                <p className="empty-state">Cargando órbitas...</p>
              ) : amigos.length === 0 ? (
                <p className="empty-state">Este planeta aún no tiene satélites en órbita.</p>
              ) : (
                amigos.map((amigo) => (
                  <SuggestedPlanet key={amigo.uid} {...amigo} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;