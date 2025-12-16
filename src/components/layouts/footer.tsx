export default function Footer() {
  return (
    <footer className="bg-blue-700 text-white py-8 mt-16">
      <div className="container mx-auto px-6 text-center space-y-2">
        <p>
          &copy; {new Date().getFullYear()} BPOM Magang. All rights reserved.
        </p>
        <p>
          <a
            href="https://www.bpom.go.id"
            className="underline hover:text-blue-300"
          >
            Website Resmi BPOM
          </a>
        </p>
      </div>
    </footer>
  );
}
