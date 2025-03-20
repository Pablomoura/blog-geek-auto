import fs from "fs";
import path from "path";

type Post = {
  titulo: string;
  texto: string;
  imagem: string;
};

export default function Home() {
  const filePath = path.join(process.cwd(), "public", "posts.json");
  const jsonData = fs.readFileSync(filePath, "utf-8");
  const posts: Post[] = JSON.parse(jsonData);

  return (
    <div>
      <h2>Últimas Notícias Geek</h2>
      {posts.map((post, index) => (
        <article key={index} style={{ marginBottom: "20px", padding: "15px", border: "1px solid #ccc" }}>
          <h3>{post.titulo}</h3>
          <img src={post.imagem} alt={post.titulo} width={500} />
          <p>{post.texto}</p>
        </article>
      ))}
    </div>
  );
}