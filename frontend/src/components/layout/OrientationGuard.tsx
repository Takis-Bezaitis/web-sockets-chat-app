import { useMediaQuery } from "../../hooks/useMediaQuery";

const OrientationGuard = () => {
  const isLandscape = useMediaQuery("(orientation: landscape)");
  const isTouchDevice = useMediaQuery("(hover: none) and (pointer: coarse)");

  if (!(isTouchDevice && isLandscape)) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-background flex flex-col items-center justify-center animate-fade-in">
      <div className="text-6xl">📱</div>

      <h2 className="mt-4 text-2xl font-bold text-foreground">
        Portrait mode required
      </h2>

      <p className="mt-2 text-center text-muted px-6 max-w-md">
        Please rotate your device to portrait orientation to continue using the app.
      </p>
    </div>
  );
};

export default OrientationGuard;