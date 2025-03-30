// src/utils/produtosAmazon.ts

export interface ProdutoAmazon {
  titulo: string;
  asin: string;
  imagem: string;
}

export const produtosPorCategoria: Record<string, ProdutoAmazon[]> = {
  filmes: [
    {
      titulo: "Blu-ray - Vingadores: Ultimato",
      asin: "B09R1CXM53",
      imagem: "https://upload.wikimedia.org/wikipedia/pt/thumb/9/9b/Avengers_Endgame.jpg/250px-Avengers_Endgame.jpg",
    },
    {
      titulo: "O Hobbit + pôster Capa dura",
      asin: "8595084742",
      imagem: "https://m.media-amazon.com/images/I/91M9xPIf10L._SL1500_.jpg",
    },
    {
      titulo: "Star Wars: Dark Edition: Edição épica",
      asin: "8594540892",
      imagem: "https://m.media-amazon.com/images/I/71ML3IL9orL._SL1200_.jpg",
    },
  ],
  games: [
    {
      titulo: "The Legend of Zelda Encyclopedia",
      asin: "150670638X",
      imagem: "https://m.media-amazon.com/images/I/91kaE4XaeLL._SL1500_.jpg",
    },
    {
      titulo: "Sony PlayStation 5 DualSense",
      asin: "B08HNSHD7K",
      imagem: "https://m.media-amazon.com/images/I/5102Pp-TfHL.jpg",
    },
    {
      titulo: "Assassin’s Creed Shadows Edição SteelBook",
      asin: "B0DTQ4QNLJ",
      imagem: "https://cdn.awsli.com.br/300x300/2110/2110782/produto/333221401/ac_red_steelbook_cm_mockup_open_3d_03-olurbeaqvl.png",
    },
  ],
  "séries e tv": [
    {
      titulo: "Almofada Formato BABY YODA",
      asin: "B08VRXZCWL",
      imagem: "https://m.media-amazon.com/images/I/51ws6LW7oEL._SL1000_.jpg",
    },
    {
      titulo: "Box As Crônicas de Gelo e Fogo - 5 Volumes",
      asin: "8544100120",
      imagem: "https://m.media-amazon.com/images/I/61Bdsd91xAL._SL1123_.jpg",
    },
    {
      titulo: "Funko Pop Eleven - Stranger Things",
      asin: "B01M5IK8M9",
      imagem: "https://m.media-amazon.com/images/I/81Xrw7HMKvL._AC_SL1500_.jpg",
    },
  ],
  "mangás e animes": [
    {
      titulo: "Solo Leveling 01",
      asin: "6525919495",
      imagem: "https://m.media-amazon.com/images/I/61EYZ1S4tCL.jpg",
    },
  {
    titulo: "Box One Piece – Vol. 1 ao 3",
    asin: "6559603091",
    imagem: "https://m.media-amazon.com/images/I/61UgfcEDV8L._SL1000_.jpg",
  },
  {
    titulo: "Funko Pop! Naruto Uzumaki (Shippuden)",
    asin: "B07XB241MQ",
    imagem: "https://m.media-amazon.com/images/I/71AjrkMQFkL._AC_SL1500_.jpg",
  }
]
};
