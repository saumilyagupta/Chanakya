import { Link, NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useState } from "react";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-[#FFFFFF] border-2 border-[#000000] px-4 md:px-8 py-3 md:py-6 grid-texture">
      {/* Desktop Layout */}
      <div className="hidden md:grid w-full grid-cols-[auto_1fr_auto] items-center gap-4">
        {/* Logo - Left (no padding) */}
        <div className="flex justify-start pl-0">
          <Link
            to="/"
            className="text-2xl md:text-4xl font-bold text-[#000000] no-underline hover:text-[#000000]"
          >
            Chanakya
          </Link>
        </div>

        {/* Navigation - Center */}
        <nav className="flex items-center justify-center gap-4 md:gap-12">
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

        {/* Auth Buttons - Right (no padding) */}
        <div className="flex gap-2 md:gap-4 justify-end pr-0">
          <Link
            to="/signup"
            className="px-4 md:px-8 py-2 md:py-3 bg-[#F99DA8] border-2 border-[#000000] font-bold text-[#000000] text-sm md:text-base no-underline hover:text-[#000000] shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            Sign-Up
          </Link>
          <Link
            to="/login"
            className="px-4 md:px-8 py-2 md:py-3 bg-[#FDE047] border-2 border-[#000000] font-bold text-[#000000] text-sm md:text-base no-underline hover:text-[#000000] shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-1 hover:translate-y-1 transition-all"
          >
            Login
          </Link>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl font-bold text-[#000000] no-underline hover:text-[#000000]"
          >
            Chanakya
          </Link>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-[#000000] border-2 border-[#000000] bg-white hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mt-4 space-y-4 pb-4 border-t-2 border-[#000000] pt-4">
            {/* Navigation Links */}
            <nav className="flex flex-col gap-3">
              <NavLink
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className="text-base text-[#000000] no-underline hover:text-[#000000] py-2 px-3 border-2 border-[#000000] bg-white hover:bg-gray-100 transition-colors"
              >
                Home
              </NavLink>
              <NavLink
                to="/faqs"
                onClick={() => setIsMenuOpen(false)}
                className="text-base text-[#000000] no-underline hover:text-[#000000] py-2 px-3 border-2 border-[#000000] bg-white hover:bg-gray-100 transition-colors"
              >
                FAQs
              </NavLink>
              <NavLink
                to="/contact"
                onClick={() => setIsMenuOpen(false)}
                className="text-base text-[#000000] no-underline hover:text-[#000000] py-2 px-3 border-2 border-[#000000] bg-white hover:bg-gray-100 transition-colors"
              >
                Contact
              </NavLink>
            </nav>

            {/* Auth Buttons */}
            <div className="flex flex-col gap-3 pt-2">
              <Link
                to="/signup"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 bg-[#F99DA8] border-2 border-[#000000] font-bold text-[#000000] text-base no-underline hover:text-[#000000] shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-1 hover:translate-y-1 transition-all text-center"
              >
                Sign-Up
              </Link>
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 bg-[#FDE047] border-2 border-[#000000] font-bold text-[#000000] text-base no-underline hover:text-[#000000] shadow-[4px_4px_0px_0px_#000000] hover:shadow-[2px_2px_0px_0px_#000000] hover:translate-x-1 hover:translate-y-1 transition-all text-center"
              >
                Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
