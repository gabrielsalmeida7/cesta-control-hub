
import React from "react";

/**
 * Footer component displayed at the bottom of all pages
 * 
 * @returns {JSX.Element} Footer with credits
 */
const Footer = () => {
  return (
    <footer className="bg-gray-100 py-4 px-6 text-center text-gray-600 text-sm mt-auto">
      <p>Criado Gabriel Almeida - NTM</p>
      <p className="text-xs mt-1">Sistema de Controle de Cestas Básicas e alimentos</p>
    </footer>
  );
};

export default Footer;
