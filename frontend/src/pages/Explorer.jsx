import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import BarSearch from "../components/BarSearch";
import SearchTabs from "../components/SearchTabs";
import { auth } from "../config/firebase";
import { getAll as getAllUsers } from "../services/userService";
import { obtenerAmigos } from "../services/friendshipService";
import { getAll } from "../services/postService";
import { obtenerUidsOcultos } from "../services/blockService";
import SuggestedPlanet from "../components/SuggestedPlanet";
import "./Explorer.css";

const Explorer = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("todo");
  const [posts, setPosts] = useState([]);
  const [planetas, setPlanetas] = useState([]);
  const [uidsOcultos, setUidsOcultos] = useState(new Set());
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    const cargarPosts = async () => {
      const snapshot = await getAll();
      const postsArray = snapshot.docs.map((docSnap) => ({
        id:docSnap.id,
        ...docSnap.data(),
      }));
      postsArray.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      );

      setPosts(postsArray);
    };
    cargarPosts();
  },[]);

  useEffect(() => {
    if (!currentUserId) return;

    const cargarPlanetas = async () => {
      const snapshot = await getAllUsers();
      const usuarios = snapshot.docs
        .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
        .filter((u) => u.uid && u.uid !== currentUserId);

      const conAmigos = await Promise.all(
        usuarios.map(async (u) => {
          const amigos = await obtenerAmigos(u.uid);
          return {
            uid: u.uid,
            nombre: u.nombrePlaneta || "Sin nombre",
            handle: (u.nombrePlaneta || "").toLowerCase().replace(/\s+/g, ""),
            avatar: u.avatar || "#9ca3af",
            bio: u.biografia || "",
            satelites: amigos.length,
            orbitando: amigos.length,
          };
        })
      );

      setPlanetas(conAmigos);
    };

    cargarPlanetas();
  }, [currentUserId]);

  // Oculta perfiles y posts de cuentas bloqueadas (por mí o que me bloquearon a mí)
  useEffect(() => {
    if (!currentUserId) return;

    obtenerUidsOcultos(currentUserId).then(setUidsOcultos).catch(console.error);
  }, [currentUserId]);
  
  const filtrarPlanetas = (planeta, texto) => {
    if (texto.startsWith("@")) {
      const handleBuscado = texto.slice(1);
      return planeta.handle.toLowerCase().includes(handleBuscado.toLowerCase());
    }
    if (texto.startsWith("#")) {
      return false;
    }
    return planeta.nombre.toLowerCase().includes(texto.toLowerCase());
  };

  const filtrarPosts = (post,texto) => {
    if (texto.startsWith("#")) {
      const bioBuscado = texto.slice(1);
      return post.description.toLowerCase().includes(bioBuscado.toLowerCase());
    }
    if (texto.startsWith("@")) {
      return false;
    }
    return post.description.toLowerCase().includes(texto.toLowerCase());
  };

  const resultadosPlanetas = planetas
    .filter((planeta) => !uidsOcultos.has(planeta.uid))
    .filter((planeta) => filtrarPlanetas(planeta, search));

  const resultadosPosts = posts
    .filter((post) => !uidsOcultos.has(post.authorId))
    .filter((post) => filtrarPosts(post, search));


  return (
    <div className="explorer-page">
      <Navbar />
      <div className={`explorer-content ${activeTab === "todo" ? "wide" : ""}`}>
        {" "}
        <BarSearch valor={search} onChange={setSearch} />
        <div className="options">
          <SearchTabs activeTab={activeTab} onChange={setActiveTab} />
        </div>
        <div
          className={`content-card ${activeTab === "todo" ? "two-columns" : ""}`}
        >
          {(activeTab === "todo" || activeTab === "planetas") && (
            <div className="content-planets">
              {resultadosPlanetas.map((planeta) => (
                <SuggestedPlanet key={planeta.uid} {...planeta} />
              ))}
            </div>
          )}

          {(activeTab === "todo" || activeTab === "transmisiones") && (
            <div className="content-posts">
              {resultadosPosts.map((post) => (
                <PostCard key={post.id} id={post.id} {...post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Explorer;
