import Lottie, { type LottieRefCurrentProps } from "lottie-react";
import { useEffect, useRef, useState, type FC } from "react";

import sunToMoonDark from "../assets/sun_to_moon_theme_dark.json";
import sunToMoonLight from "../assets/sun_to_moon_theme_light.json";
import { useTheme, useToggleTheme } from "../model/theme.store";

interface ThemeTogglerProps {
  className?: string;
}

export const ThemeToggler: FC<ThemeTogglerProps> = ({ className }) => {
  const theme = useTheme();
  const toggleTheme = useToggleTheme();

  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const [playing, setPlaying] = useState(false);
  const moon: [number, number] = [14, 28];
  const sun: [number, number] = [0, 14];

  const animationData = theme === "dark" ? sunToMoonDark : sunToMoonLight;

  useEffect(() => {
    const frame = theme === "dark" ? 0 : 14;
    lottieRef.current?.goToAndStop(frame, true);
  }, [theme]);

  const onClick = () => {
    if (playing) {
      return;
    }
    setPlaying(true);

    const segment: [number, number] = theme === "light" ? moon : sun;

    lottieRef.current?.playSegments(segment, true);
  };

  const onComplete = () => {
    setPlaying(false);
    toggleTheme();
  };

  return (
    <button className={className + " cursor-pointer"} onClick={onClick}>
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={false}
        autoplay={false}
        onComplete={onComplete}
      />
    </button>
  );
};
