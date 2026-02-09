/**
 * Desmos Graphing Calculator Component
 * Built-in calculator for Digital SAT math modules
 */
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Calculator, X, Minimize2, Maximize2 } from 'lucide-react';

// Type declarations for Desmos API
declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (element: HTMLElement, options?: any) => any;
    };
  }
}

interface DesmosCalculatorProps {
  isVisible: boolean;
  onClose: () => void;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onMaximize?: () => void;
}

const DesmosCalculator: React.FC<DesmosCalculatorProps> = ({
  isVisible,
  onClose,
  isMinimized = false,
  onMinimize,
  onMaximize
}) => {
  const calculatorRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [calculator, setCalculator] = useState<any>(null);

  useEffect(() => {
    if (isVisible && !isLoaded && calculatorRef.current) {
      // Load Desmos API
      const script = document.createElement('script');
      const apiKey = process.env.NEXT_PUBLIC_DESMOS_API_KEY || 'dcb3171b9316b08f25d96636ab1fdc95';
      script.src = `https://www.desmos.com/api/v1.8/calculator.js?apiKey=${apiKey}`;
      script.async = true;
      
      script.onload = () => {
        if (window.Desmos && calculatorRef.current) {
          // Create Desmos calculator instance
          const calc = window.Desmos.GraphingCalculator(calculatorRef.current, {
            settingsMenu: false,
            expressions: false,
            lockViewport: false,
            showGrid: true,
            showXAxis: true,
            showYAxis: true,
            xAxisNumbers: true,
            yAxisNumbers: true,
            polarMode: false,
            trace: false,
            border: false,
            paste: true,
            pointsOfInterest: true,
            settings: {
              trace: false,
              lockViewport: false,
              showGrid: true,
              showXAxis: true,
              showYAxis: true,
              xAxisNumbers: true,
              yAxisNumbers: true,
              polarMode: false,
              degrees: true,
              projectorMode: false,
              squareAspect: false,
              restrictGridToFirstQuadrant: false,
              showTrace: false,
              showLabels: true,
              showBrackets: true,
              showKoreanLabels: false
            }
          });

          // Set up calculator for SAT use
          calc.setMathSettings({
            degrees: true,
            restrictGridToFirstQuadrant: false
          });

          // Add basic functions and constants
          calc.setExpression({
            id: 'pi',
            latex: 'π ≈ 3.14159'
          });

          calc.setExpression({
            id: 'e',
            latex: 'e ≈ 2.71828'
          });

          setCalculator(calc);
          setIsLoaded(true);
        }
      };

      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, [isVisible, isLoaded]);

  useEffect(() => {
    if (!isVisible && calculator) {
      // Clear calculator when hidden
      calculator.setBlank();
    }
  }, [isVisible, calculator]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className={`bg-white rounded-lg shadow-2xl ${isMinimized ? 'w-96' : 'w-full max-w-4xl h-full max-h-screen'} flex flex-col`}>
        {/* Header */}
        <div className="bg-gray-800 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Calculator className="h-5 w-5" />
            <h3 className="font-semibold">Desmos Graphing Calculator</h3>
            <span className="text-sm text-gray-300">Digital SAT Math Tool</span>
          </div>
          <div className="flex items-center space-x-2">
            {onMinimize && onMaximize && (
              <button
                onClick={isMinimized ? onMaximize : onMinimize}
                className="p-1 hover:bg-gray-700 rounded transition-colors"
                title={isMinimized ? "Maximize" : "Minimize"}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Close Calculator"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Calculator Content */}
        <div className="flex-1 bg-white">
          {!isMinimized ? (
            <div className="h-full">
              {/* Quick Tips */}
              <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <span className="font-medium text-blue-800">Quick Tips:</span>
                    <span className="text-gray-600">Type expressions like y = x^2</span>
                    <span className="text-gray-600">Use π for pi, √ for square root</span>
                    <span className="text-gray-600">Click graph to add points</span>
                  </div>
                  <button
                    onClick={() => {
                      if (calculator) {
                        calculator.setBlank();
                        // Re-add constants
                        calculator.setExpression({ id: 'pi', latex: 'π ≈ 3.14159' });
                        calculator.setExpression({ id: 'e', latex: 'e ≈ 2.71828' });
                      }
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-xs"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              
              {/* Desmos Calculator Container */}
              <div 
                ref={calculatorRef} 
                className="w-full" 
                style={{ height: isMinimized ? '200px' : '500px' }}
              />
            </div>
          ) : (
            /* Minimized View */
            <div className="p-4">
              <div className="text-center text-gray-600">
                <Calculator className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Calculator minimized</p>
                <p className="text-xs text-gray-500">Click maximize to expand</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-4 py-2 rounded-b-lg border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center space-x-4">
              <span>• Graph functions and equations</span>
              <span>• Find points of interest</span>
              <span>• Scientific calculator functions</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Powered by Desmos</span>
              <span>•</span>
              <span>Digital SAT Approved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesmosCalculator;
