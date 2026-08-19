import { useState, useEffect } from "react";
import Composer from "../components/Composer";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import SuggestedPlanets from "../components/SuggestedPlanets";
import { getAll } from "../services/postService"; // ajusta el path si es distinto
import "./Feed.css";

export default function Feed() {
  const [posts, setPosts] = useState([]);

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

  const handlePostEliminado = (postId) => {
    setPosts((postsActuales) => postsActuales.filter((post) => post.id !== postId));
  };

  return (
    <div className="feed-page">
      <div className="stars"></div>
      <Navbar />
      <div className="feed-main">
        <div className="feed-content">
          <Composer onPostCreado={cargarPosts} />
          {posts.map((post) => (
            <PostCard
              key={post.id}
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
          ))}
        </div>
        <div className="feed-SuggestedPlanets">
          <SuggestedPlanets />
        </div>
      </div>
    </div>
  );
}
