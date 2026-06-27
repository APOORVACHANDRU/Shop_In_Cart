declare module "*.css";
declare module "*.svg";
declare module "*.png";
declare module "*.jpg";

declare const process: {
  env: {
    REACT_APP_API_URL?: string;
    NODE_ENV: string;
    [key: string]: string | undefined;
  };
};
