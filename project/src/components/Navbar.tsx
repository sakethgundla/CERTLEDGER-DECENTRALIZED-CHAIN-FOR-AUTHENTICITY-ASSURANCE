import React from 'react';
import { Link } from 'react-router-dom';
import { Award, School, GraduationCap, Search } from 'lucide-react';
import WalletInfo from './WalletInfo';
import '../styles/animations.css';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center group">
              <Award className="h-8 w-8 text-blue-600 transform transition-transform duration-300 group-hover:rotate-12" />
              <span className="ml-2 text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">CERTLEDGER</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              to="/institute" 
              className="flex items-center px-4 py-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 button-transition"
            >
              <School className="h-5 w-5 mr-2 transform transition-transform group-hover:rotate-12" />
              <span>Institute</span>
            </Link>
            <Link 
              to="/student" 
              className="flex items-center px-4 py-2 rounded-md text-gray-700 hover:text-green-600 hover:bg-green-50 transition-all duration-300 button-transition"
            >
              <GraduationCap className="h-5 w-5 mr-2 transform transition-transform group-hover:rotate-12" />
              <span>Student</span>
            </Link>
            <Link 
              to="/verify" 
              className="flex items-center px-4 py-2 rounded-md text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300 button-transition"
            >
              <Search className="h-5 w-5 mr-2 transform transition-transform group-hover:rotate-12" />
              <span>Verify</span>
            </Link>
            <WalletInfo />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;