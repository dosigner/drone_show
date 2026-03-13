import Scene from "../../components/Scene";

export default function ShowPage() {
  return (
    <div className="relative w-screen h-screen bg-black">
      <Scene />
      
      {/* Optional Overlay for controls if needed */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-white/30 text-xs tracking-widest uppercase">
          Agency for Defense Development
        </p>
      </div>
    </div>
  );
}
