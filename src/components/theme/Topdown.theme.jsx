import React, { useState, useEffect } from "react";
import IconButton from "@mui/material/IconButton";
import { FaArrowUp } from "react-icons/fa";

const ScrollToTopButton = React.memo(() => {
    const [isVisible, setIsVisible] = useState(false);

    // Show or hide the button based on the scroll position
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", toggleVisibility);

        return () => {
            window.removeEventListener("scroll", toggleVisibility);
        };
    }, []);

    // Scroll the window to the top smoothly
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <>
            {isVisible && (
                <div
                    style={{
                        position: "fixed",
                        bottom: "40px",
                        right: "40px",
                        zIndex: 1000,
                    }}
                >
                    <IconButton
                        aria-label="Scroll to top"
                        onClick={scrollToTop}
                        color="primary"
                        sx={{bgcolor:"primary.main"}}
                        size="large"
                    >
                        <FaArrowUp color="white" />
                    </IconButton>
                </div>
            )}
        </>
    );
});
ScrollToTopButton.displayName = "ScrollToTopButton";
export default ScrollToTopButton;
