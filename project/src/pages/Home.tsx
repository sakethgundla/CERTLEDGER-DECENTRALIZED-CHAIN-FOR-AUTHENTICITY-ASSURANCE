import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Shield, Key } from 'lucide-react';

const Home = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-fadeIn">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 animate-slideDown">
          Secure Digital Certificates 
        </h1>
        <p className="text-xl text-gray-600 mb-8 animate-slideUp">
          Issue, manage, and verify certificates with blockchain technology
        </p>
      </div>
      <br></br>
      

      <div className="grid md:grid-cols-3 gap-8 mt-12">
        <Link 
          to="/institute" 
          className="bg-white p-6 rounded-lg shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-t-4 border-blue-600 group cursor-pointer"
        >
          <div className="flex items-center justify-center mb-4">
            <Award className="h-12 w-12 text-blue-600 transform transition-transform duration-300 group-hover:rotate-12" />
          </div>
          <h3 className="text-xl font-semibold text-center mb-2 text-blue-800 group-hover:text-blue-600 transition-colors">
            Issue Certificates
          </h3>
          <p className="text-gray-600 text-center group-hover:text-blue-600 transition-colors">
            Institutions can issue tamper-proof digital certificates secured by blockchain
          </p>
        </Link>

        <Link 
          to="/student" 
          className="bg-white p-6 rounded-lg shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-t-4 border-green-600 group cursor-pointer"
        >
          <div className="flex items-center justify-center mb-4">
            <Key className="h-12 w-12 text-green-600 transform transition-transform duration-300 group-hover:rotate-12" />
          </div>
          <h3 className="text-xl font-semibold text-center mb-2 text-green-800 group-hover:text-green-600 transition-colors">
            Access Anywhere
          </h3>
          <p className="text-gray-600 text-center group-hover:text-green-600 transition-colors">
            Students can access their certificates anytime using their blockchain wallet
          </p>
        </Link>

        <Link 
          to="/verify" 
          className="bg-white p-6 rounded-lg shadow-md transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-t-4 border-purple-600 group cursor-pointer"
        >
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-purple-600 transform transition-transform duration-300 group-hover:rotate-12" />
          </div>
          <h3 className="text-xl font-semibold text-center mb-2 text-purple-800 group-hover:text-purple-600 transition-colors">
            Instant Verification
          </h3>
          <p className="text-gray-600 text-center group-hover:text-purple-600 transition-colors">
            Verify the authenticity of certificates using unique blockchain tokens
          </p>
        </Link>
      </div>

      
    </div>
  );
};

// Add these styles to your global CSS or create a new style tag
const styles = document.createElement('style');
styles.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideDown {
    from { transform: translateY(-20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .animate-fadeIn {
    animation: fadeIn 1s ease-out;
  }

  .animate-slideDown {
    animation: slideDown 1s ease-out;
  }

  .animate-slideUp {
    animation: slideUp 1s ease-out;
  }
`;
document.head.appendChild(styles);

export default Home;