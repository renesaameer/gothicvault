import { useLayoutData } from "./LayoutDataProvider";

const WhatsAppFloat = () => {
  const { whatsapp, loaded } = useLayoutData();

  if (!loaded || !whatsapp?.enabled || !whatsapp.phone_number) return null;

  return (
    <a
      href={`https://wa.me/${whatsapp.phone_number}`}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-float"
      aria-label="Chat on WhatsApp"
      style={{ contentVisibility: "auto" }}
    >
      {whatsapp.radar_animation && (
        <>
          <span className="whatsapp-radar" />
          <span className="whatsapp-radar" style={{ animationDelay: "0.6s" }} />
        </>
      )}
      <svg viewBox="0 0 32 32" className="w-7 h-7 relative z-10" fill="white">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16.004c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.118-1.958A15.924 15.924 0 0016.004 32C24.826 32 32 24.826 32 16.004 32 7.176 24.826 0 16.004 0zm9.312 22.594c-.39 1.1-1.932 2.014-3.164 2.28-.844.18-1.946.322-5.656-1.216-4.748-1.966-7.804-6.776-8.038-7.092-.226-.316-1.892-2.52-1.892-4.808s1.196-3.412 1.622-3.878c.426-.466.928-.582 1.236-.582.308 0 .616.002.886.016.284.014.666-.108.942.718.322.858 1.09 2.946 1.186 3.162.098.216.162.468.032.752-.13.284-.196.46-.39.712-.196.252-.41.564-.588.756-.196.21-.4.438-.172.858.228.42 1.014 1.674 2.178 2.712 1.496 1.336 2.758 1.75 3.15 1.944.39.196.618.162.846-.098.228-.26.978-1.14 1.24-1.532.26-.39.52-.326.878-.196.358.13 2.272 1.072 2.662 1.268.39.196.65.292.746.456.098.162.098.944-.292 2.044z" />
      </svg>
    </a>
  );
};

export default WhatsAppFloat;
