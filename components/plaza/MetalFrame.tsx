export default function MetalFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"metal-frame relative rounded-2xl " + className}>
      <span className="metal-frame-topline" />
      {children}
    </div>
  );
}
