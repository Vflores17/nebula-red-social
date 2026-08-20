import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Composer from "../components/Composer";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import SuggestedPlanets from "../components/SuggestedPlanets";
import { auth } from "../config/firebase";
import { getAll } from "../services/postService";
import { obtenerUidsOcultos } from "../services/blockService";
import { obtenerAmigos } from "../services/friendshipService";
import { useAuth } from "../context/AuthContext";
import "./Feed.css";

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [uidsOcultos, setUidsOcultos] = useState(new Set());
  // Uids de los planetas que el usuario orbita (la app no tiene un sistema de
  // "seguir" separado: "orbitar" -> amistad aceptada es la relación que se usa
  // para personalizar qué transmisiones se ven en el Feed).
  const [uidsOrbitados, setUidsOrbitados] = useState(null); // null = aún no cargó
  const { user } = useAuth();
  const currentUserId = auth.currentUser?.uid || user?.uid;

  const cargarPosts = async () => {
    const snapshot = await getAll();
    const postsArray = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // ordena del más nuevo al más viejo
    postsArray.sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );

    setPosts(postsArray);
  };

  useEffect(() => {
    cargarPosts();
  }, []); // se ejecuta una sola vez, al entrar al Feed

  // Oculta las publicaciones de cuentas bloqueadas (por mí o que me bloquearon a mí)
  useEffect(() => {
    if (!currentUserId) return;

    obtenerUidsOcultos(currentUserId).then(setUidsOcultos).catch(console.error);
  }, [currentUserId]);

  // Carga los planetas que orbito, para mostrar un feed personalizado
  // (solo mis transmisiones + las de quienes orbito), no las de todo el cosmos.
  useEffect(() => {
    if (!currentUserId) return;

    obtenerAmigos(currentUserId)
      .then((amigosIds) => setUidsOrbitados(new Set(amigosIds)))
      .catch((err) => {
        console.error(err);
        setUidsOrbitados(new Set());
      });
  }, [currentUserId]);

  const handlePostEliminado = (postId) => {
    setPosts((postsActuales) => postsActuales.filter((post) => post.id !== postId));
  };

  const cargandoPersonalizacion = !!currentUserId && uidsOrbitados === null;

  // Combina exclusión por bloqueos, restricción por órbitas y visibilidad privada
  const postsVisibles = posts
    .filter((post) => !uidsOcultos.has(post.authorId))
    .filter((post) => {
      // Solo el autor puede ver sus posts privados; undefined se considera público.
      const puedeVerPrivado = post.visibility !== "private" || post.authorId === currentUserId;
      const puedeVerModerado = post.estado !== "pendiente" || post.authorId === currentUserId;

      // Personalización por órbita (amigos)
      const cumpleOrbita = 
        !currentUserId ||
        !uidsOrbitados || // todavía cargando: no ocultar nada de golpe
        post.authorId === currentUserId ||
        uidsOrbitados.has(post.authorId);

      return puedeVerPrivado && cumpleOrbita;
    });

  const feedVacio =
    !cargandoPersonalizacion &&
    uidsOrbitados &&
    uidsOrbitados.size === 0 &&
    postsVisibles.length === 0;

  return (
    <div className="feed-page">
      <div className="stars"></div>
      <Navbar />
      <div className="feed-main">
        <div className="feed-content">
          <Composer onPostCreado={cargarPosts} />
          {feedVacio ? (
            <p className="feed-empty">
              Todavía no orbitas ningún planeta. Cuando empieces a orbitar
              a otros usuarios, sus transmisiones aparecerán aquí. Mientras
              tanto, dale un vistazo al{" "}
              <Link to="/explorar">Explorador</Link>.
            </p>
          ) : (
            postsVisibles.map((post) => (
              <PostCard
                key={post.id}
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
            ))
          )}
        </div>
        <div className="feed-SuggestedPlanets">
          <SuggestedPlanets />
        </div>
      </div>
    </div>
  );
}