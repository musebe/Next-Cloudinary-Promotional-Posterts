import { useRouter } from "next/dist/client/router";
import { useState } from "react";
import LayoutComponent from "../components/Layout";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      const formData = new FormData(event.target);

      const response = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      router.push(`/images/`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutComponent>
      <div className="wrapper">
        <form onSubmit={handleFormSubmit}>
          <h1>Generate promotional poster with cloudinary</h1>
          <p>Upload a sample product with a discounted price</p>
          <div className="form-item">
            <label htmlFor="name">Product Name</label>
            <input
              type="text"
              name="name"
              id="name"
              required
              disabled={loading}
            />
          </div>
          <div className="form-item">
            <label htmlFor="name">Product Price (USD)</label>
            <input
              type="number"
              name="price"
              id="price"
              required
              disabled={loading}
            />
          </div>
          <div className="form-item">
            <label htmlFor="discountPercentage">Discount Percentage</label>
            <input
              type="number"
              name="discountPercentage"
              id="discountPercentage"
              required
              disabled={loading}
            />
          </div>
          <div className="form-item">
            <label htmlFor="image">Product Image</label>
            <small>A PNG image with a transparent background works best</small>
            <input
              type="file"
              name="image"
              id="image"
              required
              multiple={false}
              accept=".png"
              disabled={loading}
            />
          </div>
          <div className="form-item">
            <button type="submit" disabled={loading}>
              Upload
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        div.wrapper {
          width: 100vw;
          min-height: 100vh;
        }

        div.wrapper form {
          max-width: 600px;
          margin: 20px auto;
          padding: 50px 30px;
          background-color: #f3f3f3;
          display: flex;
          flex-flow: column nowrap;
          gap: 20px;
        }

        div.wrapper form div.form-item {
          display: flex;
          flex-flow: column nowrap;
        }

        div.wrapper form div.form-item input {
          min-height: 50px;
          border-radius: 5px;
          padding: 5px;
        }

        div.wrapper form div.form-item input[type="file"] {
          margin: 10px 0;
          background-color: #ffffff;
          border: solid 2px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </LayoutComponent>
  );
}
