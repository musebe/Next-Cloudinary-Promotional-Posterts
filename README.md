# Generate promotional posters using Cloudinary and Next.js

## Introduction

Product offers are a great way to drive sales when you have a business. One of the most common ways to inform customers about product offers and launches is through the use of promotional posters and graphics which can then be posted on social media or even printed out. In this short tutorial, let's take a look at how we can generate a simple promotional poster using just [Cloudinary](https://cloudinary.com/?ap=em) and [Next.js](https://nextjs.org/). [Cloudinary](https://cloudinary.com/?ap=em) is a service that provides different APIs geared towards the upload, storage, manipulation, optimization and distribution of different types of media(images,videos). You can get started with a free developer account and use their free tier.

## Prerequisites and setup

The first requirement is a no brainer. Basic/working knowledge of HTML, CSS, Javascript is required. Knowledge of React.js, Next.js and Node.js is recommended but is not required. You'll also need to have Node.js and NPM on your development environment. With that, go ahead and create a new [cloudinary](https://cloudinary.com/?ap=em) account if you do not already have one and proceed to sign in. Head over to your [dashboard](https://cloudinary.com/console?ap=em) and look for the `Cloud name`, `API Key` and `API Secret`. We'll be using these shortly.

![Cloudinary Dashboard](https://github.com/newtonmunene99/promotional-poster-with-cloudinary/blob/master/public/images/cloudinary-dashboard.png "Cloudinary Dashboard")

Let's go ahead and create a new Next.js project. We'll just be creating a basic project with the bare minimum. Check out the [docs](https://nextjs.org/docs/) for more options.

```bash
npx create-next-app promotional-poster-with-cloudinary
```

You can give it any name you want. For this tutorial we used the name `promotional-poster-with-cloudinary`. Change directory to your new project and open in in your favorite code editor

```bash
cd promotional-poster-with-cloudinary
```

We also need to install a few dependencies before proceeding. These are [Cloudinary](https://www.npmjs.com/package/cloudinary) and [Formidable](https://www.npmjs.com/package/formidable). The former allows us to communicate with the Cloudinary APIs and the latter helps us parse incoming form data on our API routes. Run the following command to install both.

```bash
npm install cloudinary formidable
```

And now let's add the Cloudinary API Keys that we got earlier to our environment variables. Environment variables are a great way to store sensitive keys. Next.js has built in support for environment variables. Read about this [here](https://nextjs.org/docs/basic-features/environment-variables).

Create a new file at the root of your project and name it `.env.local`. Paste the following inside

```env
CLOUD_NAME=YOUR_CLOUD_NAME
API_KEY=YOUR_API_KEY
API_SECRET=YOUR_API_SECRET
```

Replace `YOUR_CLOUD_NAME` `YOUR_API_KEY` and `YOUR_API_SECRET` with the `Cloud name`, `API Key` and `API Secret` values that we got earlier from our cloudinary [dashboard](https://cloudinary.com/console?ap=em).

## Getting started

Create a new folder at the root of your project and name it `lib`. This folder will hold our shared code. Inside it, create a new file called `cloudinary.js` and paste the following code inside.

```js
// lib/cloudinary.js

// Import the v2 api and rename it to cloudinary
import { v2 as cloudinary, TransformationOptions } from "cloudinary";

// Initialize the sdk with cloud_name, api_key and api_secret
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const CLOUDINARY_FOLDER_NAME = "promotional-posters/";

/**
 * Get cloudinary uploads
 * @returns {Promise}
 */
export const handleGetCloudinaryUploads = () => {
  return cloudinary.api.resources({
    type: "upload",
    prefix: CLOUDINARY_FOLDER_NAME,
    resource_type: "image",
  });
};

/**
 * Uploads an image to cloudinary and returns the upload result
 *
 * @param {{path: string; transformation?:TransformationOptions;publicId?: string; folder?: boolean; }} resource
 */
export const handleCloudinaryUpload = (resource) => {
  return cloudinary.uploader.upload(resource.path, {
    // Folder to store image in
    folder: resource.folder ? CLOUDINARY_FOLDER_NAME : null,
    // Public id of image.
    public_id: resource.publicId,
    // Type of resource
    resource_type: "auto",
    // Transformation to apply to the video
    transformation: resource.transformation,
  });
};

/**
 * Deletes resources from cloudinary. Takes in an array of public ids
 * @param {string[]} ids
 */
export const handleCloudinaryDelete = (ids) => {
  return cloudinary.api.delete_resources(ids, {
    resource_type: "image",
  });
};
```

Let's go over that. This file contains all the functions that we need to communicate with cloudinary. At the top we import the v2 API and initialize it by calling the `.config` method and passing the cloud name, api key and api secret. Notice how we use the environment variables that we defined earlier.

`CLOUDINARY_FOLDER_NAME` is the name of the folder where we want to store our images. This will make it much easier to fetch all uploaded images later.

`handleGetCloudinaryUploads` calls the `api.resources` method on the cloudinary SDK to get a all resources uploaded to the folder we defined at `CLOUDINARY_FOLDER_NAME`. Read more about this method in the [admin api docs]((https://cloudinary.com/documentation/admin_api#get_resources)).

`handleCloudinaryUpload` calls the `uploader.upload` method on the SDK. It takes in a resource object. The object contains a path to the file we want to upload, and an optional cloudinary transformation option. The transformation option is an array of transformation objects that you can apply to the image being uploaded. You can find more information on this method from the [upload docs](https://cloudinary.com/documentation/image_upload_api_reference#upload_method).

`handleCloudinaryDelete` passes an array of public IDs to the `api.delete_resources` method for deletion.

The next thing we need is a function to parse form data that we receive in our API routes. Create a new file under the `lib` folder and name it `parse-form.js`. Inside `lib/parse-form.js` paste the following code

```js
// lib/parse-form.js 

import { IncomingForm } from "formidable";

/**
 * Parses the incoming form data.
 *
 * @param {NextApiRequest} req The incoming request object
 */
export const parseForm = (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ keepExtensions: true, multiples: true });

    form.parse(req, (error, fields, files) => {
      if (error) {
        return reject(error);
      }

      return resolve({ fields, files });
    });
  });
};

```

We create a new incoming form and then parse it using [formidable](https://www.npmjs.com/package/formidable). The method will return fields and files extracted from the form data. In case of an error during parsing, it will reject the promise so that we can handle the error.

Let's move on to our API routes. We need to upload an image of the product that we want to display on the poster. To achieve this, we'll create an endpoint where we can post our form data to. API routes are a core feature of Next.js and I suggest that you have a look at the [docs](https://nextjs.org/docs/api-routes/introduction) if you're not familiar with the concept.

Create a new folder under the `pages/api` folder and name it `images`. Inside `pages/api/images` create two files, one named `index.js` and another called `[id].js`. The first will handle requests made to the `/api/images` endpoint and the second will handle requests made to the `/api/images/:id` endpoint. 

Paste the following code inside `pages/api/images/index.js`

```js
// pages/api/images/index.js 

import { NextApiRequest, NextApiResponse } from "next";
import {
  handleCloudinaryDelete,
  handleCloudinaryUpload,
  handleGetCloudinaryUploads,
} from "../../../lib/cloudinary";
import { parseForm } from "../../../lib/parse-form";

// Custom config for our API route
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * The handler function for the API route. Takes in an incoming request and outgoing response.
 *
 * @param {NextApiRequest} req The incoming request object
 * @param {NextApiResponse} res The outgoing response object
 */
const ImagesRoute = async (req, res) => {
  switch (req.method) {
    case "GET": {
      try {
        const result = await handleGetRequest();

        return res.status(200).json({ message: "Success", result });
      } catch (error) {
        return res.status(400).json({ message: "Error", error });
      }
    }

    case "POST": {
      try {
        const result = await handlePostRequest(req);

        return res.status(201).json({ message: "Success", result });
      } catch (error) {
        console.error(error);
        return res.status(400).json({ message: "Error", error });
      }
    }

    default: {
      return res.status(405).json({ message: "Method not allowed" });
    }
  }
};

const handleGetRequest = async () => {
  const uploads = await handleGetCloudinaryUploads();

  return uploads;
};

/**
 * Handles the POST request to the API route.
 *
 * @param {NextApiRequest} req The incoming request object
 */
const handlePostRequest = async (req) => {
  // Get the form data using the parseForm function
  const data = await parseForm(req);

  const { name, price, discountPercentage } = data.fields;

  // Get product image from the parsed form data
  const image = data.files.image;

};

export default ImagesRoute;

```

The basic structure of a Next.js API route is a file with a function that's a default export. In our case the funcion `ImagesRoute` is the default export. At the top of our file we export a custom config object. This particular one tells Next.js not to use the default body parser since we'll be receiving form data and we want to parse that ourselves. Read more about API route custom configuration from the [docs](https://nextjs.org/docs/api-routes/api-middlewares#custom-config).

Our API route handler,`ImagesRoute` accepts the incoming request object as the first parameter and the outgoing response object as the second parameter. We use a switch statement to differentiate among different request methods. We only want to handle GET and POST requests for this route. For all other methods we return a 405 - Method not allowed response.

`handleGetRequest` gets all uploaded images by calling the `handleGetCloudinaryUploads` function that we created earlier.

`handlePostRequest` takes in the incoming request object then passes it to the `parseForm` function that we created earlier. The function returns the data extracted from the form data. We then get the fields and image file as well.

Now we need to upload the received image, then upload the base image/background for the poster and apply a few transformations to the base image. For the base image, I decided to use an image with a black background. [Here's a link to the image if you'd like to use it as well](https://github.com/newtonmunene99/promotional-poster-with-cloudinary/blob/master/public/images/base.png). I have placed this image under `public/images` folder so that we can reference it in the code easily. Please note that this is just a preference, you can use a more creative background and instead of storing it in your project you can choose to upload an image along with the product image. For this case I just chose to use a static image for simplicity. 

Inside `pages/api/images/index.js` replace `handlePostRequest` with the following.

```js
// ...
/**
 * Handles the POST request to the API route.
 *
 * @param {NextApiRequest} req The incoming request object
 */
const handlePostRequest = async (req) => {
  // Get the form data using the parseForm function
  const data = await parseForm(req);

  const { name, price, discountPercentage } = data.fields;

  // Get product image from the parsed form data
  const image = data.files.image;

  const productImageUploadResult = await handleCloudinaryUpload({
    path: image.path,
    folder: false,
  });

  const baseImagePath = "public/images/base.png";

  const finalImageUploadResult = await handleCloudinaryUpload({
    path: baseImagePath,
    folder: true,
    transformation: [
      {
        overlay: {
          font_family: "Arial",
          font_size: 120,
          font_weight: "bold",
          stroke: "stroke",
          letter_spacing: 2,
          text: "BLACK FRIDAY",
        },
        border: "5px_solid_black",
        color: "#FFFFFF",
        gravity: "north",
        y: 100,
      },
      {
        overlay: {
          font_family: "Arial",
          font_size: 150,
          font_weight: "bold",
          stroke: "stroke",
          letter_spacing: 2,
          text: "MEGA DEALS",
        },
        border: "5px_solid_black",
        background: "#FF0000",
        color: "#000000",
        gravity: "north",
        y: 300,
      },
      {
        overlay: productImageUploadResult.public_id.replace(/\//g, ":"),
        width: 800,
        height: 800,
        crop: "fill",
        gravity: "north",
        y: 500,
      },
      {
        overlay: {
          font_family: "Arial",
          font_size: 80,
          font_weight: "bold",
          stroke: "stroke",
          letter_spacing: 2,
          text: name,
        },
        border: "5px_solid_black",
        color: "#FFFFFF",
        gravity: "north",
        y: 1400,
      },

      {
        overlay: {
          font_family: "Arial",
          font_size: 40,
          font_weight: "bold",
          letter_spacing: 2,
          text: `${discountPercentage} percent off`,
        },
        background: "#FF0000",
        color: "#000000",
        gravity: "north",
        y: 1500,
      },
      {
        overlay: {
          font_family: "Arial",
          font_size: 40,
          font_weight: "bold",
          stroke: "stroke",
          decoration: "strikethrough",
          letter_spacing: 2,
          text: `was USD ${price}`,
        },
        border: "5px_solid_black",
        color: "#FFFFFF",
        gravity: "north",
        y: 1600,
      },
      {
        overlay: {
          font_family: "Arial",
          font_size: 60,
          font_weight: "bold",
          stroke: "stroke",
          letter_spacing: 2,
          text: `now USD ${price - price * (discountPercentage / 100)}`,
        },
        border: "5px_solid_black",
        color: "#FFFFFF",
        gravity: "north",
        y: 1700,
      },
    ],
  });

  // Delete the uploaded images that we no longer need
  await handleCloudinaryDelete([productImageUploadResult.public_id]);

  return finalImageUploadResult;
};
// ...
```

Let's go over this. Once we have our fields and product image, we upload the product image to cloudinary and store the upload result in a variable called `productImageUploadResult`. We then define the path to the base image/poster background. In our case, we've placed the image in `public/images/base.png`. We'll upload this image to cloudinary but also apply a few transformations. We need to place some text over the background image and also layer our product image on top as well. To understand the structure of the transformation object, have a look at [this](https://cloudinary.com/documentation/image_transformations#parameter_types) and [this](https://cloudinary.com/documentation/image_upload_api_reference#:~:text=transformations%20is%20completed.-,transformation,-String). The more important options to note are the `gravity` and `y` options. The gravity option tells cloudinary where to place the origin(0,0). For this case we want everything to be center aligned on the x axis and only change the y co-ordinates. This is why we set the gravity for all our overlays to **north**. For the y co-ordinates, we just want to increment the value by a bit so that layers don't lay over each other. The other options are just to style the text and/or image. We then return the upload result.

Let's handle the other endpoint. Inside `pages/api/images/[id].js` paste the following code

```js
import { NextApiRequest, NextApiResponse } from "next";
import { handleCloudinaryDelete } from "../../../lib/cloudinary";

/**
 * The handler function for the API route. Takes in an incoming request and outgoing response.
 *
 * @param {NextApiRequest} req The incoming request object
 * @param {NextApiResponse} res The outgoing response object
 */
const ImageRoute = async (req, res) => {
  const { id } = req.query;

  switch (req.method) {
    case "DELETE": {
      try {
        if (!id) {
          throw new Error("No ID provided");
        }

        const result = await handleDeleteRequest(id);

        return res.status(200).json({ message: "Success", result });
      } catch (error) {
        console.error(error);
        return res.status(400).json({ message: "Error", error });
      }
    }

    default: {
      return res.status(405).json({ message: "Method not allowed" });
    }
  }
};

/**
 * Handles the DELETE request to the API route.
 *
 * @param {string} id Public ID of the image to delete
 */
const handleDeleteRequest = (id) => {
  // Delete the uploaded image from Cloudinary
  return handleCloudinaryDelete([id.replace(":", "/")]);
};

export default ImageRoute;

```

This is similar to the other API route, only that here we're only handling DELETE requests. We just pass the id to `handleDeleteRequest` which then calls the `handleCloudinaryDelete` function that we created earlier. 

That's it for the backend. Let's move on to the frontend which is fairly easy. I won't go in depth here because it's mostly just basic React.js.

Add the following styles to `styles/globals.css`

```css
a:hover {
  text-decoration: underline;
}

button {
  padding: 20px 30px;
  border: none;
  font-weight: bold;
  background-color: var(--primary-color);
  color: #ffffff;
  cursor: pointer;
}

button:disabled {
  background-color: #cfcfcf;
}

button:hover:not([disabled]) {
  background-color: var(--primary-color-shade);
}

```

These are just some styles that we'll be using globally. We've also made use of CSS variables here. Read all about that [here](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) if you're not familiar with CSS Variables. Next we need a layout component to wrap our pages in so that we have a consistent layout.

Create a folder at the root of your project and name it `components`. Inside create a file called `Layout.js` and paste the following code inside

```jsx
import Head from "next/head";
import Link from "next/link";

const LayoutComponent = (props) => {
  const { children } = props;

  return (
    <div>
      <Head>
        <title>Generate promotional poster with cloudinary</title>
        <meta
          name="description"
          content="Generate promotional poster with cloudinary"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav>
        <Link href="/">
          <a>Home</a>
        </Link>
        <Link href="/images">
          <a>Images</a>
        </Link>
      </nav>
      <main>{children}</main>
      <style jsx>{`
        nav {
          min-height: 100px;
          background-color: var(--primary-color);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        nav a {
          color: white;
          margin: 0 10px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default LayoutComponent;

```

Next, the home page. Here we'll upload products so they can be converted to posters. Paste the following code inside `pages/index.js`

```jsx
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

```

This is just a component with a form that asks for the product name, price, discount percentage and image and then posts that as form data to the `/api/images` endpoint when the form is submitted. I'll draw your attention to the `useState`, `useCallback` and `useEffect` hooks. These are basic react hooks but i'll go over them briefly. The first just stores some state. When the state changes, a component re-render is triggered. Read all about it [here](https://reactjs.org/docs/hooks-reference.html#usestate). The second, stores a memoized callback function. This means that it only changes when one of it's depencencies changes and not on every re-render. Read about it [here](https://reactjs.org/docs/hooks-reference.html#usecallback). The last is used to run side effects. For example when a component is rendered or unmounted. Read about it [here](https://reactjs.org/docs/hooks-reference.html#useeffect).

Next create a file called `images.js` under `pages/` folder. Paste the following code inside.

```jsx
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
```

This component calls `getImages` when the component first renders using the `useEffect` hook that we discussed earlier. `getImages` makes a GET request to the `/api/images` endpoint and gets all uploaded resources then updates the `images` state. `handleDelete` makes a DELETE request to the `api/images/:id` endpoint and deletes an image using its public ID. The rest is just basic HTML and some styling.

## Finishing up

Before we run our application, add the following to `next.config.js`. You'll find it at the root of your project. You can create it if it doesn't exist.

```js
module.exports = {
  // ... other options
  images: {
    domains: ["res.cloudinary.com"],
  },
};
```

We've just added the cloudinary domain so that the Image component from Next.js can optimize images from this domain. You can have a read [here](https://nextjs.org/docs/api-reference/next/image#configuration-options) for more detailed information.

You can now run your app on development

```bash
npm run dev
```

To run a production build, I suggest you read the Next.js docs. Please bear in mind that this is a very minimal build and you could certainly make it better and more optimized. You'll also notice that we use a very simple design for the poster, this is just so I can get the basics across. Feel free to use a more sophisticated background for your poster. You can also add a few shapes or something to make it more lively.

You can find the full code on my [Github](https://github.com/newtonmunene99/promotional-poster-with-cloudinary)