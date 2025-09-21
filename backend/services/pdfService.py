from fastapi import HTTPException
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration


class PDFGenerationService:
    @staticmethod
    async def generate_pdf(html_content: str, filename: str) -> bytes:
        """Generate PDF from HTML content using weasyprint"""
        try:
            # Create font configuration
            font_config = FontConfiguration()

            # Create HTML object
            html_doc = HTML(string=html_content)

            # Generate PDF with custom CSS for better rendering
            css = CSS(string="""
                @page {
                    size: A4;
                    margin: 0.5in;
                }
                body {
                    font-family: Arial, sans-serif;
                }
            """)

            # Generate PDF
            pdf_bytes = html_doc.write_pdf(stylesheets=[css], font_config=font_config)

            return pdf_bytes

        except ImportError:
            raise HTTPException(
                status_code=500,
                detail="PDF generation library not installed. Please install weasyprint: pip install weasyprint"
            )
        except Exception as error:
            print(f"PDF Generation Error: {error}")
            raise HTTPException(
                status_code=500,
                detail=f"PDF generation failed: {str(error)}"
            )
