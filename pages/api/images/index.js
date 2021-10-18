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

export default ImagesRoute;
