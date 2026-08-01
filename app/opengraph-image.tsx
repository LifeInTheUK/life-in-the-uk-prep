import { ImageResponse } from "next/og";

export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 32,
                    background: "#4f46e5",
                    fontFamily: "sans-serif",
                    color: "white",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 140,
                        height: 140,
                        borderRadius: 28,
                        background: "rgba(255,255,255,0.15)",
                        fontSize: 56,
                        fontWeight: 700,
                        letterSpacing: -1,
                    }}
                >
                    UK
                </div>
                <div
                    style={{
                        display: "flex",
                        fontSize: 56,
                        fontWeight: 700,
                        letterSpacing: -1,
                    }}
                >
                    Life in the UK Test Prep
                </div>
                <div
                    style={{
                        display: "flex",
                        fontSize: 28,
                        fontWeight: 500,
                        opacity: 0.85,
                    }}
                >
                    Free practice questions with spaced repetition
                </div>
            </div>
        ),
        { ...size },
    );
}
