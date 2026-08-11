export const demoUsers = {
  tierra: {
    authorId: "demo-user",
    nombre: "Tierra",
    handle: "tierra",
    avatar: "#3b82f6",
    displayName: "Tierra",
    satellites: 234,
    orbiting: 567,
  },
  marte: {
    authorId: "demo-marte",
    nombre: "Marte",
    handle: "marte",
    avatar: "#ef4444",
    displayName: "Marte",
    satellites: 5643,
    orbiting: 2103,
  },
  venus: {
    authorId: "demo-venus",
    nombre: "Venus",
    handle: "venus",
    avatar: "#f59e0b",
    displayName: "Venus",
    satellites: 2891,
    orbiting: 1234,
  },
  jupiter: {
    authorId: "demo-jupiter",
    nombre: "Júpiter",
    handle: "jupiter",
    avatar: "#d97706",
    displayName: "Júpiter",
    satellites: 8734,
    orbiting: 3402,
  },
};

// 👇 Esta es la ÚNICA línea que necesitas cambiar para simular otro usuario
export const usuarioActivo = demoUsers.jupiter;