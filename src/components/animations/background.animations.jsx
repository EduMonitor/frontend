import  Box  from '@mui/material/Box';

export const FloatingElements = ({ aiFeatures }) => {
  const floatingElements = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
  }));

  return (
    <>
      {floatingElements.map((element) => (
        <Box
          key={element.id}
          sx={{
            position: 'absolute',
            left: `${element.x}%`,
            top: `${element.y}%`,
            width: '4px',
            height: '4px',
            borderRadius: '50%',
            background: `linear-gradient(45deg, ${aiFeatures[element.id % aiFeatures.length].color}, transparent)`,
            animation: `float ${element.duration}s ease-in-out infinite`,
            animationDelay: `${element.delay}s`,
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) scale(1)', opacity: 0.7 },
              '50%': { transform: 'translateY(-20px) scale(1.2)', opacity: 1 },
            },
          }}
        />
      ))}
    </>
  );
};


export const AnimatedGrid = () => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(74, 144, 226, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(74, 144, 226, 0.1) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        animation: 'gridMove 20s linear infinite',
        '@keyframes gridMove': {
          '0%': { transform: 'translate(0, 0)' },
          '100%': { transform: 'translate(50px, 50px)' },
        },
      }}
    />
  );
};

