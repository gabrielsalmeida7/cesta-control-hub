
import React from 'react';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, children }) => {
  return (
    <div className="page-header">
      <h2 className="page-title">{title}</h2>
      <div className="page-actions">
        {children}
      </div>
    </div>
  );
};

export default PageHeader;
