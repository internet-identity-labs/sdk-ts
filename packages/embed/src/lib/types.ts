export type NFIDConfig = {
  origin?: string;
  application?: {
    name?: string;
    logo?: string;
  };
  ic?: {
    derivationOrigin?: string | URL;
  };
};
