import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProfileHeader from "../components/ProfileHeader";
import ProfileTabs from "../components/ProfileTabs";
import PostCard from "../components/PostCard";
import { useAuth } from "../context/AuthContext";
import { getAll, getById } from "../services/postService";
import { getRepostsByUser } from "../services/repostService";
import "./Profile.css";

const Profile = () => {
  const [activeTab, setActiveTab] = useState("transmisiones");
  const [misPosts, setMisPosts] = useState([]);
  const { user, userProfile } = useAuth();

  useEffect(() => {
    const cargarTodo = async () => {
      if (!user) return;
      // 1. Posts que yo escribí directamente
      const snapshot = await getAll();
      const todosLosPosts = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
        esRepost: false,
      }));
      const propios = todosLosPosts.filter((post) => post.authorId === user.uid);

      // 2. Posts que yo retransmití (aunque no sean míos originalmente)
      const repostsSnapshot = await getRepostsByUser(user.uid);
      const repostsData = repostsSnapshot.docs.map((d) => d.data());

      // Para cada repost, traemos el post ORIGINAL completo con getById
      const repostsConPost = await Promise.all(
        repostsData.map(async (repost) => {
          const postDoc = await getById(repost.originalPostId);
          if (!postDoc) return null; // por si el post original fue borrado

          return {
            id: postDoc.id,
            ...postDoc.data(),
            esRepost: true,
            repostCreatedAt: repost.createdAt, // fecha en que TÚ lo retransmitiste
          };
        })
      );

      // filtramos los que pudieron salir null (post original borrado)
      const repostsValidos = repostsConPost.filter(Boolean);

      // 3. Combinamos ambas listas y ordenamos por fecha relevante
      const combinado = [...propios, ...repostsValidos].sort((a, b) => {
        const fechaA = a.esRepost ? a.repostCreatedAt : a.createdAt;
        const fechaB = b.esRepost ? b.repostCreatedAt : b.createdAt;
        return (fechaB?.seconds || 0) - (fechaA?.seconds || 0);
      });

      setMisPosts(combinado);
    };

    cargarTodo();
  }, [user]);

  const handlePostEliminado = (postId) => {
    setMisPosts((postsActuales) => postsActuales.filter((post) => post.id !== postId));
  };

  return (
    <div className="planeta-page">
      <Navbar />
      <div className="planeta-content">
        <Link to="/" className="volver-link">
          ← Volver al Cosmos
        </Link>

        <ProfileHeader profile={{
          avatar: userProfile?.avatar || "",
          displayName: userProfile?.nombrePlaneta || "Explorador",
          username: userProfile?.handle || userProfile?.username || userProfile?.nombrePlaneta || "explorador",
          bio: userProfile?.biografia || "",
          location: userProfile?.ubicacion || "",
          joinedAt: userProfile?.createdAt?.toDate?.().toLocaleDateString("es-CR", { month: "long", year: "numeric" }) || "",
          satellites: userProfile?.satellites || 0,
          orbiting: userProfile?.orbiting || 0,
        }} />
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
                    timeAgo={post.createdAt?.toDate?.() || new Date()}
                    destellosNum={post.destellosNum}
                    commentsNum={post.commentsNum}
                    sharesNum={post.sharesNum}
                    onPostEliminado={handlePostEliminado}
                  />
                </div>
              ))
            ))}

          {activeTab === "planetas" && <p className="empty-state">No orbita ningún planeta aún</p>}
          {activeTab === "orbitando" && <p className="empty-state">Nadie orbita este planeta aún</p>}
        </div>
      </div>
    </div>
  );
};

export default Profile;
