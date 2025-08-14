import Link from "next/link";

const Footer = () => {
  return (
    <footer className="flex flex-col items-center justify-center gap-2 p-8 pt-4">
      <p className="text-xs">© Copyright - 65 Passion Montagne</p>
      <p className="text-xs">
        Développé et designé par{" "}
        <Link href="https://www.simondesdevises.com" className="underline">
          Simon Desdevises
        </Link>
      </p>
    </footer>
  );
};

export default Footer;
