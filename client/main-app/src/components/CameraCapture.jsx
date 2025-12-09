import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, X, RefreshCw, Check } from 'lucide-react';

const CameraCapture = ({ onCapture, onClose }) => {
    const webcamRef = useRef(null);
    const [imgSrc, setImgSrc] = useState(null);

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current.getScreenshot();
        setImgSrc(imageSrc);
    }, [webcamRef]);

    const retake = () => {
        setImgSrc(null);
    };

    const confirm = () => {
        if (imgSrc) {
            // Convert base64 to file
            fetch(imgSrc)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
                    onCapture(file);
                    onClose();
                });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Camera size={20} /> Capture Certificate
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <X size={20} />
                    </button>
                </div>

                {/* Camera / Preview Area */}
                <div className="relative bg-black aspect-[4/3] flex items-center justify-center overflow-hidden">
                    {imgSrc ? (
                        <img src={imgSrc} alt="captured" className="w-full h-full object-contain" />
                    ) : (
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            videoConstraints={{ facingMode: "environment" }}
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>

                {/* Controls */}
                <div className="p-6 bg-white flex justify-center gap-6">
                    {!imgSrc ? (
                        <button
                            onClick={capture}
                            className="h-16 w-16 rounded-full border-4 border-white bg-red-600 shadow-lg ring-2 ring-red-600 flex items-center justify-center hover:scale-105 transition-transform"
                        >
                            <div className="h-14 w-14 rounded-full bg-red-500 border-2 border-white" />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={retake}
                                className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                            >
                                <RefreshCw size={18} /> Retake
                            </button>
                            <button
                                onClick={confirm}
                                className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition-colors"
                            >
                                <Check size={18} /> Use Photo
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CameraCapture;
