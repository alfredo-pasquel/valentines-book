import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css'; // This file includes your @tailwind directives

const sections = ['Journal', 'Calendar', 'Gallery'];

export default function App() {
  const [isBookOpen, setBookOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('Journal');

  console.log("isBookOpen:", isBookOpen, "activeSection:", activeSection);

  // Variants for the cover (the book cover that rotates open)
  const coverVariants = {
    closed: { rotateY: 0 },
    open: { rotateY: -150, transition: { duration: 1, ease: 'easeInOut' } }
  };

  // Variants for the inner content container (pages)
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // Variants for switching between sections
  const sectionVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-pink-100 flex items-center justify-center p-4">
      {/* Book container with 3D perspective and explicit height */}
      <div
        className="relative w-full max-w-md h-[500px] bg-white shadow-xl rounded-lg overflow-hidden"
        style={{ perspective: '1200px' }}
      >
        {/* Book Cover: visible when the book is closed */}
        <AnimatePresence>
          {!isBookOpen && (
            <motion.div
              className="absolute inset-0 cursor-pointer bg-cover bg-center"
              variants={coverVariants}
              initial="closed"
              animate="closed" // Remains in closed state until clicked
              exit="closed"
              onClick={() => {
                console.log("Cover clicked!");
                setBookOpen(true);
              }}
              style={{
                transformOrigin: 'left center',
                backgroundImage: "url('/book.png')"
              }}
            >
              <div className="flex items-center justify-center h-full bg-black bg-opacity-40 text-white text-2xl font-bold">
                Tap to Open
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Book Content: visible when the book is open */}
        <AnimatePresence>
          {isBookOpen && (
            <motion.div
              className="relative p-6 h-full"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="flex justify-end">
                <button
                  onClick={() => setBookOpen(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>
              <div className="mt-4">
                <div className="flex space-x-4 mb-4">
                  {sections.map((section) => (
                    <button
                      key={section}
                      onClick={() => setActiveSection(section)}
                      className={`px-4 py-2 rounded-md transition-colors duration-300 ${
                        activeSection === section
                          ? 'bg-pink-500 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {section}
                    </button>
                  ))}
                </div>
                <AnimatePresence exitBeforeEnter>
                  <motion.div
                    key={activeSection}
                    variants={sectionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                  >
                    {activeSection === 'Journal' && <JournalSection />}
                    {activeSection === 'Calendar' && <CalendarSection />}
                    {activeSection === 'Gallery' && <GallerySection />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function JournalSection() {
  return (
    <div className="text-gray-800">
      <h2 className="text-xl font-semibold mb-2">Journal</h2>
      <p>
        Today, I reflect on our journey together—each memory is a cherished page in our story.
      </p>
    </div>
  );
}

function CalendarSection() {
  return (
    <div className="text-gray-800">
      <h2 className="text-xl font-semibold mb-2">Calendar</h2>
      <p>
        Special dates mark the milestones of our love. Every day is a new chapter.
      </p>
    </div>
  );
}

function GallerySection() {
  return (
    <div className="text-gray-800">
      <h2 className="text-xl font-semibold mb-2">Gallery</h2>
      <p>
        A collection of moments captured in time—each photo a window into our past and future.
      </p>
    </div>
  );
}
