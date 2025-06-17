export default function LoadingNoticia() {
  return (
    <div className="flex items-center justify-center h-screen bg-black text-white">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-orange-400 border-dashed rounded-full animate-spin mx-auto" />
        <p className="text-sm text-orange-400 animate-pulse">Carregando notícia…</p>
      </div>
    </div>
  );
}