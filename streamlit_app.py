"""
Streamlit app to embed the MentePyme PWA for demo purposes.

This app reads the existing static files from the PWA (index.html, style.css
and app.js) and inlines the CSS and JavaScript so that the app can be
rendered directly inside a Streamlit component. The service worker
registration is removed to avoid errors in the Streamlit context.

To run locally:

    pip install streamlit
    streamlit run streamlit_app.py

You can also deploy this file on streamlit.cloud (streamlit.app) by
pointing the deployment to this script in your GitHub repository.
"""

import re
from pathlib import Path
import streamlit as st
import streamlit.components.v1 as components



def load_file(filename: str) -> str:
    """Read a text file relative to this script's directory."""
    base_dir = Path(__file__).resolve().parent
    file_path = base_dir / filename
    return file_path.read_text(encoding="utf-8")


def build_html() -> str:
    """Assemble the HTML by inlining CSS and JS, removing unsupported features."""
    index_html = load_file("index.html")
    css = load_file("style.css")
    js = load_file("app.js")

    # Remove external resource references from the HTML
    index_html = index_html.replace(
        '<link rel="stylesheet" href="./style.css" />', ""
    )
    index_html = index_html.replace(
        '<script type="module" src="./app.js"></script>', ""
    )

    # Remove service worker registration from JS to prevent errors on Streamlit
    js = re.sub(
        r"navigator\.serviceWorker[^;]*;", "// service worker registration removed;", js
    )

    # Inline CSS and JS into the HTML
    html = index_html.replace("</head>", f"<style>{css}</style>\n</head>")
    html = html.replace("</body>", f"<script>{js}</script>\n</body>")

    return html


def main() -> None:
    st.set_page_config(
        page_title="MentePyme Demo", page_icon="🧮", layout="centered"
    )
    st.title("MentePyme Demo")
    st.write(
        "Esta aplicación de Streamlit incrusta la PWA MentePyme en un componente HTML "
        "para ofrecer un demo interactivo sin necesidad de instalar la app."
    )

    # Build the inlined HTML
    html_content = build_html()

    # Display the HTML inside Streamlit
    components.html(html_content, height=900, scrolling=True)


if __name__ == "__main__":
    main()
