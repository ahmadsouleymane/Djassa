import { useEffect } from "react";

type PageMetaOptions = {
  description?: string;
  image?: string;
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export function usePageTitle(title: string, options: PageMetaOptions = {}) {
  const { description, image } = options;

  useEffect(() => {
    const fullTitle = `${title} | Djassa`;
    document.title = fullTitle;
    upsertMeta("property", "og:title", fullTitle);
    upsertCanonical(window.location.href);
    upsertMeta("property", "og:url", window.location.href);

    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
    }
    if (image) {
      upsertMeta("property", "og:image", image);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, image]);
}
