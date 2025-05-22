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
      titulo: "Star Wars Jedi: Survivor - Xbox Series X",
      asin: "B0BP5L9VLH",
      imagem: "https://m.media-amazon.com/images/I/61UsW1AtZBL._AC_SL1000_.jpg",
    },
    {
      titulo: "Super Mario Party Jamboree Switch",
      asin: "B0DL7CVGV5",
      imagem: "https://m.media-amazon.com/images/I/71Oi1FfHdxL._AC_SL1500_.jpg",
    },
    {
      titulo: "Nintendo, Console, Switch Oled + Super Mario Bros",
      asin: "B0DJG1S4J3",
      imagem: "https://m.media-amazon.com/images/I/71h2AkOhdML._AC_SL1500_.jpg",
    },
    {
      titulo: "Galápagos, Munchkin, Jogo de Cartas",
      asin: "B078PSP9TJ",
      imagem: "https://m.media-amazon.com/images/I/719j4tdmuPL._AC_SL1000_.jpg",
    },
    {
      titulo: "Galápagos Jogos Patchwork, Jogo de Tabuleiro",
      asin: "B0B445R41P",
      imagem: "https://m.media-amazon.com/images/I/71ZXALJWOnL._AC_SL1500_.jpg",
    },
    {
      titulo: "Galápagos, Trial by Trolley, Jogo de Cartas",
      asin: "B08RQDLZ5G",
      imagem: "https://m.media-amazon.com/images/I/611eSE49-fL._AC_SL1000_.jpg",
    },
    {
      titulo: "Galápagos, Munchkin 4: Montaria Arredia (Expansão)",
      asin: "B07CJXF6MK",
      imagem: "https://m.media-amazon.com/images/I/61ZE4KwygxL._AC_SL1000_.jpg",
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
    {
      titulo: "Red Plume Camiseta masculina de super-herói",
      asin: "B075WQL3JC",
      imagem: "https://m.media-amazon.com/images/I/51F4mLP70OL._AC_SX679_.jpg",
    },
  ],
  "mangás e animes": [
    {
      titulo: "Solo Leveling 01",
      asin: "6525919495",
      imagem: "https://m.media-amazon.com/images/I/61EYZ1S4tCL.jpg",
    },
    {
      titulo: "Moletom Canguru Anime Jujutsu Kaisen Goju Satoru",
      asin: "B09RPVQ7SX",
      imagem: "https://m.media-amazon.com/images/I/51G2htiMzqL._AC_SX679_.jpg",
    },
    {
      titulo: "Camiseta Spider Man Homem Aranha",
      asin: "B0C11ZD8XK",
      imagem: "https://m.media-amazon.com/images/I/41yofz651cL._AC_.jpg",
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
