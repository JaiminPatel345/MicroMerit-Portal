#!/bin/bash

# Test script for employer chatbot

echo "Testing Employer Chatbot..."
echo "============================"
echo ""

# Test with sample data
curl -X POST http://localhost:8000/ai/employer-chat \
  -H "Content-Type: application/json" \
  -d '{
    "learner_email": "test@example.com",
    "question": "What programming skills does this candidate have?",
    "credentials": [
      {
        "certificate_title": "Python Development Bootcamp",
        "issuer_name": "Tech University",
        "issued_at": "2024-01-15",
        "metadata": {
          "ai_extracted": {
            "skills": [
              {"name": "Python", "category": "Programming", "proficiency_level": "Advanced", "confidence": 0.95},
              {"name": "Django", "category": "Web Framework", "proficiency_level": "Intermediate", "confidence": 0.88},
              {"name": "SQL", "category": "Database", "proficiency_level": "Intermediate", "confidence": 0.85}
            ],
            "keywords": ["Python", "Django", "SQL", "Web Development", "Backend"],
            "nsqf": {"level": 6, "confidence": 0.9},
            "description": "Comprehensive Python development course covering web frameworks and database integration"
          },
          "issuer_name": "Tech University"
        }
      },
      {
        "certificate_title": "Docker and Kubernetes Fundamentals",
        "issuer_name": "Cloud Academy",
        "issued_at": "2024-03-20",
        "metadata": {
          "ai_extracted": {
            "skills": [
              {"name": "Docker", "category": "DevOps", "proficiency_level": "Intermediate", "confidence": 0.92},
              {"name": "Kubernetes", "category": "DevOps", "proficiency_level": "Beginner", "confidence": 0.80},
              {"name": "Container Orchestration", "category": "DevOps", "proficiency_level": "Beginner", "confidence": 0.78}
            ],
            "keywords": ["Docker", "Kubernetes", "Containers", "DevOps", "Cloud"],
            "nsqf": {"level": 5, "confidence": 0.85},
            "description": "Course on containerization and orchestration using Docker and Kubernetes"
          },
          "issuer_name": "Cloud Academy"
        }
      }
    ]
  }' | jq

echo ""
echo "============================"
echo "Test complete!"
