import { ThemeToggler } from "@/features/theme";
import { GlassBlock } from "@/shared/ui/glass-block";
import GithubIcon from "../assets/github.svg?react";
import TelegramIcon from "../assets/telegram.svg?react";
import { TelegramLoginButton } from "@/features/auth";

export const HomePage = () => {
  return (
    <section className="h-screen flex flex-col justify-between items-center">
      <div className="flex-1 flex items-center justify-center w-full">
        <GlassBlock className="w-full md:max-w-1/3 flex flex-col justify-center items-center p-3">
          <h1 className="text-5xl font-bold">Chain Stalker</h1>
          <p className="text-primary mt-3">
            Instant alerts. Total control. No noise, only signals.
          </p>
          <TelegramLoginButton />
        </GlassBlock>
      </div>
      <GlassBlock className="p-3 border-b-0 rounded-b-none flex justify-between gap-3">
        <ThemeToggler className="w-10 h-10" />
        <GithubIcon className="w-10 h-10 fill-current" />
        <TelegramIcon className="w-10 h-10 fill-current" />
      </GlassBlock>
    </section>
  );
};
