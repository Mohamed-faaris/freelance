# PDF Generation API

This module provides PDF generation capabilities for business and company verification reports using FastAPI and WeasyPrint.

## Features

- **Company Reports**: Generate detailed financial analysis reports for companies
- **Business Reports**: Generate business verification reports with credit scoring
- **Authentication**: JWT-based authentication
- **Professional Templates**: Beautiful, responsive HTML templates with CSS styling
- **Error Handling**: Comprehensive error handling and validation
- **Health Check**: API health monitoring endpoint

## Installation

1. Install the required dependencies:
```bash
pip install weasyprint
```

2. Make sure all other dependencies from `requirements.txt` are installed

## API Endpoints

### POST /pdf/generate-pdf

Generate a PDF report from business/company data.

**Request Body:**
```json
{
  "data": {
    // Company or Business data object
  },
  "type": "company" | "business",
  "filename": "optional-custom-filename.pdf"
}
```

**Response:**
- `200`: PDF file as binary content
- `400`: Validation error
- `401`: Authentication error
- `500`: Server error

**Example Request:**
```bash
curl -X POST "http://localhost:8000/pdf/generate-pdf" \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=your-jwt-token" \
  -d '{
    "data": {
      "business_name": "Example Company",
      "gstin": "22AAAAA0000A1Z5",
      "gstin_status": "Active"
      // ... other business data
    },
    "type": "business",
    "filename": "business-report.pdf"
  }' \
  --output report.pdf
```

### GET /pdf/health

Health check endpoint to verify API status.

**Response:**
```json
{
  "message": "PDF Generation API is running",
  "version": "2.0.0",
  "supportedTypes": ["company", "business"],
  "features": {
    "authentication": true,
    "validation": true,
    "errorHandling": true,
    "sanitization": true
  },
  "status": "healthy"
}
```

## Data Formats

### Company Data
```python
{
    "cin": "L12345MH2021PLC123456",
    "summary": {
        "InstaSummary": {
            "CompanyMasterSummary": {
                "CompanyName": "Example Technologies Ltd",
                "CompanyCIN": "L12345MH2021PLC123456",
                "CompanyDateOfInc": "2021-05-15",
                "CompanyMcaStatus": "Active",
                # ... other company details
            }
        }
    },
    "basic": { /* ... */ },
    "status": {
        "summary": "Available",
        "basic": "Available"
    }
}
```

### Business Data
```python
{
    "contact_details": {
        "principal": {
            "address": "123 Business Street, Mumbai",
            "email": "contact@example.com",
            "mobile": "9876543210",
            "nature_of_business": "IT Services"
        }
    },
    "promoters": ["John Doe", "Jane Smith"],
    "annual_turnover": "50 Lakhs to 1.5 Cr.",
    "gstin": "22AAAAA0000A1Z5",
    "pan_number": "ABCDE1234F",
    "business_name": "Example Business Solutions",
    "legal_name": "Example Business Solutions Pvt Ltd",
    "constitution_of_business": "Private Limited Company",
    "gstin_status": "Active",
    "filing_status": [
        [{
            "return_type": "GSTR-3B",
            "financial_year": "2022-23",
            "status": "Filed",
            "date_of_filing": "2023-02-15"
        }]
    ],
    # ... other business details
}
```

## Features Included

### Company Reports
- Company basic information
- Financial highlights
- Directors information
- Financial statements
- Data availability status
- Professional formatting

### Business Reports
- Business basic information
- Credit assessment with scoring
- Promoters/directors details
- Filing status history
- Risk assessment
- Business activities
- Recommendations

### Security Features
- JWT authentication
- Input validation with Pydantic
- HTML sanitization
- Error handling

### Template Features
- Responsive design
- Professional styling
- Logo integration
- Color-coded status indicators
- Print optimization
- Multi-page support

## Development

### Running Tests
```bash
python test_pdf_generation.py
```

### Code Structure
```
routes/pdf_generation.py
├── Configuration classes
├── Pydantic models for validation
├── Authentication service
├── Utility functions
├── Business logic services
├── Content generators
├── HTML template generators
├── CSS style generator
├── PDF generation service
└── Route handlers
```

### Adding New Templates
1. Create a new template method in `TemplateGenerator`
2. Add corresponding styles in `StyleGenerator.get_common_styles()`
3. Update the main generation method
4. Add any new data validation models

## Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: Invalid request data
- **Authentication Errors**: Missing or invalid tokens
- **PDF Generation Errors**: Template or rendering issues
- **Dependency Errors**: Missing libraries

All errors return appropriate HTTP status codes and detailed error messages.

## Performance

- Asynchronous PDF generation
- Efficient HTML templating
- Optimized CSS for print
- Memory-efficient processing

## Dependencies

- `fastapi`: Web framework
- `weasyprint`: PDF generation from HTML
- `pydantic`: Data validation
- `python-jose`: JWT handling
- `jinja2`: Template rendering (built-in)

## Troubleshooting

### Common Issues

1. **WeasyPrint not installed**
   ```bash
   pip install weasyprint
   ```

2. **Font rendering issues**
   - WeasyPrint handles fonts automatically
   - Custom fonts can be added via CSS

3. **Memory issues with large PDFs**
   - Optimize images and content
   - Consider pagination for large datasets

4. **Authentication errors**
   - Ensure valid JWT token in cookies
   - Check token expiration

### Logs
Check server logs for detailed error information:
```bash
tail -f server.log
```

## License

This module is part of the SYT Solutions backend system.