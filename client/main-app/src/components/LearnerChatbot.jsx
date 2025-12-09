import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Brain, User } from 'lucide-react';
import { employerApi } from '../services/authServices';
import toast from 'react-hot-toast';

const LearnerChatbot = ({ learnerEmail, learnerName }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            // Add welcome message when chat is first opened
            setMessages([{
                type: 'bot',
                content: `Hi! I'm MicroBuddy your AI assistant. Ask me anything about ${learnerName || 'this candidate'}'s skills, credentials, and qualifications. For example:\n\n• "Does this candidate have leadership skills?"\n• "What programming languages do they know?"\n• "Tell me about their certifications"`,
                timestamp: new Date()
            }]);
        }
    }, [isOpen, learnerName]);

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage = {
            type: 'user',
            content: inputValue,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await employerApi.chatWithLearner({
                learner_email: learnerEmail,
                question: inputValue
            });

            if (response.data.success) {
                const aiResponse = response.data.data;

                const botMessage = {
                    type: 'bot',
                    content: aiResponse.answer,
                    relevantSkills: aiResponse.relevant_skills || [],
                    certificates: aiResponse.certificates_referenced || [],
                    confidence: aiResponse.confidence || 0,
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, botMessage]);
            } else {
                throw new Error('Failed to get response');
            }
        } catch (error) {
            console.error('Chat error:', error);

            let errorMessage = 'Sorry, I encountered an error processing your question.';

            // Provide more specific error messages
            if (error.response?.status === 404) {
                errorMessage = 'AI service endpoint not found. Please make sure the AI service is running.';
            } else if (error.response?.status === 500) {
                errorMessage = 'AI service error. Please check the service logs for details.';
            } else if (error.code === 'ECONNREFUSED') {
                errorMessage = 'Cannot connect to AI service. Please ensure it is running on the correct port.';
            } else if (error.response?.data?.message) {
                errorMessage = `Error: ${error.response.data.message}`;
            }

            toast.error(errorMessage);

            const errorBotMessage = {
                type: 'bot',
                content: errorMessage + '\n\n💡 Tip: Check the developer console for more details.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorBotMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const suggestedQuestions = [
        "What are their key skills?",
        "Do they have any leadership experience?",
        "Tell me about their certifications",
        "What technical skills do they have?"
    ];

    const handleSuggestedQuestion = (question) => {
        setInputValue(question);
    };

    return (
        <>
            {/* Floating Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 z-50 group"
                    title="Ask  AI about this candidate"
                >
                    <div className="relative">
                        <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 animate-in slide-in-from-bottom-4 duration-300">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Brain size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    MicroBuddy
                                    <Sparkles size={16} className="animate-pulse" />
                                </h3>
                                <p className="text-xs text-blue-100">Ask about {learnerName || 'candidate'}'s skills</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                {message.type === 'bot' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                                        <Brain size={16} className="text-white" />
                                    </div>
                                )}

                                <div className={`max-w-[75%] ${message.type === 'user' ? 'order-first' : ''}`}>
                                    <div
                                        className={`p-3 rounded-2xl shadow-sm ${message.type === 'user'
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-none'
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

                                        {/* Show relevant skills if available */}
                                        {message.relevantSkills && message.relevantSkills.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <p className="text-xs font-semibold text-gray-600 mb-2">Relevant Skills:</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {message.relevantSkills.map((skill, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium border border-blue-100"
                                                        >
                                                            {skill.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Show certificates if available */}
                                        {message.certificates && message.certificates.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                <p className="text-xs font-semibold text-gray-600 mb-1">Referenced Certificates:</p>
                                                <ul className="text-xs space-y-1">
                                                    {message.certificates.map((cert, idx) => (
                                                        <li key={idx} className="flex items-start gap-1">
                                                            <span className="text-green-500 mt-0.5">✓</span>
                                                            <span className="text-gray-700">{cert}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Show confidence score if high enough */}
                                        {message.confidence > 0.7 && (
                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                <p className="text-xs text-gray-500">
                                                    Confidence: <span className="font-semibold text-green-600">{(message.confidence * 100).toFixed(0)}%</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1 px-2">
                                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {message.type === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-md">
                                        <User size={16} className="text-white" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-3 justify-start animate-in fade-in duration-300">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                    <Brain size={16} className="text-white" />
                                </div>
                                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Loader2 size={16} className="animate-spin" />
                                        <span className="text-sm">Analyzing credentials...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested Questions (only show when no messages yet) */}
                    {messages.length <= 1 && !isLoading && (
                        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                            <p className="text-xs font-semibold text-gray-500 mb-2">Suggested questions:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestedQuestions.map((question, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSuggestedQuestion(question)}
                                        className="text-xs px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about skills, credentials..."
                                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-all"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim() || isLoading}
                                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isLoading ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <Send size={20} />
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            AI-powered insights from verified credentials
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default LearnerChatbot;
