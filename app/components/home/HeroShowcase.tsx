type HeroProduct = {
  id: number;
  name: string;
  image_url: string | null;
};

function LeafMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 4c-8 0-14 4-14 11a5 5 0 0 0 5 5c7 0 11-6 9-16ZM5 21c3-5 6-8 11-11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-3-11 2 2 4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function HeroShowcase({ products }: { products: HeroProduct[] }) {
  const picturedProducts = products.filter((product) => product.image_url).slice(0, 3);

  return (
    <div className="hero-showcase" aria-label="A selection of Apex Foods products">
      <div className="showcase-backdrop" aria-hidden="true">
        <span className="backdrop-ring backdrop-ring-one" />
        <span className="backdrop-ring backdrop-ring-two" />
        <span className="showcase-sun" />
        <span className="showcase-leaf leaf-one" />
        <span className="showcase-leaf leaf-two" />
      </div>

      {picturedProducts.length > 0 ? (
        <div className="showcase-products">
          {picturedProducts.map((product, index) => (
            <figure className={`showcase-product showcase-product-${index + 1}`} key={product.id}>
              <img src={product.image_url!} alt={product.name} />
              <figcaption>{product.name}</figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="showcase-illustration" aria-hidden="true">
          <svg viewBox="0 0 440 400" fill="none">
            <ellipse cx="220" cy="342" rx="148" ry="24" fill="#19351F" fillOpacity=".09" />
            <path d="M112 219c10 88 45 135 108 135s98-47 108-135H112Z" fill="#C9A85B" />
            <path d="M112 219c35 18 72 27 108 27s73-9 108-27" stroke="#A47D35" strokeWidth="5" strokeLinecap="round" />
            <path d="M142 211c-9-48 6-80 45-89 16-45 57-57 94-28 30 23 40 62 20 117H142Z" fill="#E9D9B3" />
            <path d="M159 197c8-48 27-74 61-81 33 8 53 36 60 81" stroke="#C9A85B" strokeWidth="7" strokeLinecap="round" />
            <path d="M173 171c17-18 32-27 47-28m-31 47c12-13 23-20 34-22m20 5c13 6 24 15 34 28" stroke="#A47D35" strokeWidth="5" strokeLinecap="round" />
            <path d="M104 120c-22-24-19-51 12-73 9 31 4 54-12 73Zm228 18c22-24 19-51-12-73-9 31-4 54 12 73Z" fill="#315C3A" fillOpacity=".85" />
            <path d="M116 122c6-21 7-39 0-56m204 74c-6-21-7-39 0-56" stroke="#F3EBDD" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="illustration-caption">Good food, close to home</span>
        </div>
      )}

      <div className="floating-card floating-card-quality">
        <span className="floating-icon"><LeafMark /></span>
        <span><strong>Quality you can trust</strong><small>Thoughtfully selected staples</small></span>
      </div>
      <div className="floating-card floating-card-order">
        <span className="floating-icon"><CheckMark /></span>
        <span><strong>Simple ordering</strong><small>Browse, choose and order online</small></span>
      </div>
      <span className="showcase-grain grain-decoration-one" aria-hidden="true" />
      <span className="showcase-grain grain-decoration-two" aria-hidden="true" />
    </div>
  );
}
