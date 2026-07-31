import { ImageResponse } from "next/og";

export const size = {
    width: 48,
    height: 48,
};
export const contentType = "image/png";

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#4f46e5",
                    borderRadius: 10,
                    color: "white",
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: "sans-serif",
                    letterSpacing: -0.5,
                }}
            >
                UK
            </div>
        ),
        { ...size },
    );
}
