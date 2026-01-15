import { Link, NavLink } from "react-router-dom";

function Header() {
  return (
    <header className="bg-[#FFFFFF] border-2 border-[#000000] px-4 md:px-8 py-2 md:py-3 grid-texture">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-center justify-between gap-2 md:gap-0">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl md:text-2xl font-bold text-[#000000] no-underline hover:text-[#000000]"
        >
          Chanakya
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4 md:gap-12 relative">
          <NavLink
            to="/"
            className="text-sm md:text-lg text-[#000000] no-underline hover:text-[#000000] relative transition-colors hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[2px] hover:after:bg-[#D1D5DB] hover:after:transition-all hover:after:duration-300"
          >
            Home
          </NavLink>
          <NavLink
            to="/faqs"
            className="text-sm md:text-lg text-[#000000] no-underline hover:text-[#000000] relative transition-colors hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[2px] hover:after:bg-[#D1D5DB] hover:after:transition-all hover:after:duration-300"
          >
            FAQs
          </NavLink>
          <NavLink
            to="/contact"
            className="text-sm md:text-lg text-[#000000] no-underline hover:text-[#000000] relative transition-colors hover:after:absolute hover:after:bottom-[-4px] hover:after:left-0 hover:after:w-full hover:after:h-[2px] hover:after:bg-[#D1D5DB] hover:after:transition-all hover:after:duration-300"
          >
            Contact
          </NavLink>
        </nav>

        {/* Auth Buttons */}
        <div className="flex gap-2 md:gap-4">
          <Link
            to="/signup"
            className="px-3 md:px-6 py-1.5 md:py-2 bg-[#F99DA8] border-2 border-[#000000] font-bold text-[#000000] text-sm md:text-base no-underline hover:text-[#000000] shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            Sign-Up
          </Link>
          <Link
            to="/login"
            className="px-3 md:px-6 py-1.5 md:py-2 bg-[#FDE047] border-2 border-[#000000] font-bold text-[#000000] text-sm md:text-base no-underline hover:text-[#000000] shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
