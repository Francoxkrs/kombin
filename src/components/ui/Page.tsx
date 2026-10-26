import { ViewTransition } from "react";

/**
 * Envolve o conteúdo de cada página: ao navegar, a tela desliza para a esquerda
 * (indo mais fundo) ou para a direita (voltando), conforme o transitionTypes do link.
 */
export function Page({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "fade-in" }}
      exit={{ "nav-forward": "nav-forward", "nav-back": "nav-back", default: "fade-out" }}
      default="none"
    >
      <div className="flex min-h-dvh flex-col">{children}</div>
    </ViewTransition>
  );
}
