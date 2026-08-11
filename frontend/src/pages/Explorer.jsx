import { useState, useEffect, useEffectEvent } from "react";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import BarSearch from "../components/BarSearch";
import SearchTabs from "../components/SearchTabs";
import { planetas } from "../mocks/planets";
import { getAll } from "../services/postService";
import SuggestedPlanet from "../components/SuggestedPlanet";
import "./Explorer.css";

const Explorer = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("todo");
  const [posts, setPosts] = useState([]);

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

  const resultadosPlanetas = planetas.filter((planeta) =>
    filtrarPlanetas(planeta, search),
  );

  const resultadosPosts = posts.filter((post) => filtrarPosts(post, search));


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
                <SuggestedPlanet key={planeta.id} {...planeta} />
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
