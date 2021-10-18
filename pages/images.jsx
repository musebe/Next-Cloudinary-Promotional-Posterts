import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import LayoutComponent from "../components/Layout";
import Link from "next/link";

export default function Images() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);

  const getImages = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/images", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      setImages(data.result.resources);
      console.log(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getImages();
  }, [getImages]);

  const handleDelete = async (id) => {
    try {
      setLoading(true);

      const normalizedId = id.replace(/\//g, ":");

      const response = await fetch(`/api/images/${normalizedId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw data;
      }

      getImages();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LayoutComponent>
      {loading ? (
        <div className="loading">
          <p>Loading...</p>
        </div>
      ) : (
        <div className="wrapper">
          {images.length > 0 ? (
            <div className="images">
              {images.map((image, index) => (
                <div key={`image-${index}`} className="image">
                  <div className="image-wrapper">
                    <Image
                      src={image.secure_url}
                      alt={image.public_id}
                      width={image.width}
                      height={image.height}
                      layout="responsive"
                    />
                  </div>
                  <div className="actions">
                    <button
                      onClick={() => {
                        handleDelete(image.public_id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-images">
              <p>No images yet</p>
              <Link href="/" passHref>
                <button>Upload a product</button>
              </Link>
            </div>
          )}
        </div>
      )}
      <style jsx>{`
        div.loading {
          width: 100%;
          height: calc(100vh - 100px);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        div.wrapper {
          width: 100vw;
          min-height: 100vh;
        }

        div.wrapper > div.images {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-flow: row wrap;
          justify-content: center;
          align-items: center;
          padding: 10px;
          gap: 20px;
        }

        div.wrapper > div.images > div.image {
          flex: 0 0 400px;
          display: flex;
          flex-flow: column;
          background-color: #f5f5f5;
        }

        div.wrapper > div.images > div.image div.image-wrapper {
          flex: 1;
          padding: 10px;
        }

        div.wrapper > div.images > div.image div.actions {
          padding: 10px;
        }

        div.wrapper > div.no-images {
          width: 100%;
          height: calc(100vh - 100px);
          display: flex;
          flex-flow: column nowrap;
          justify-content: center;
          align-items: center;
        }
      `}</style>
    </LayoutComponent>
  );
}
