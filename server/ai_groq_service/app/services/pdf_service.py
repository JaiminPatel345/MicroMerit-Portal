import io
import qrcode
from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.units import inch
from PIL import Image

class PDFService:
    def create_qr_page(self, qr_data: str) -> io.BytesIO:
        """
        Generates a temporary PDF page containing a QR code and styling
        """
        packet = io.BytesIO()
        c = canvas.Canvas(packet, pagesize=A4)
        width, height = A4
        
        # Colors - using classic ReportLab colors or defining custom
        micromerit_blue = HexColor('#3366cc') # Approximating the blue 0.2, 0.4, 0.7
        micromerit_grey = HexColor('#808080')
        
        # --- Draw Design ---
        
        # Background accent
        c.setFillColor(micromerit_blue)
        c.rect(0, height - 20, width, 20, fill=True, stroke=False)
        
        # Main Title "MicroMerit"
        c.setFont("Helvetica-Bold", 40)
        c.setFillColor(micromerit_blue)
        title = "MicroMerit"
        # reportlab doesn't have a direct 'widthOfTextAtSize' on canvas, need raw stringWidth
        title_width = c.stringWidth(title, "Helvetica-Bold", 40)
        c.drawString((width - title_width) / 2, height - 150, title)
        
        # Subtitle
        c.setFont("Helvetica", 18)
        c.setFillColor(micromerit_grey)
        subtitle = "Official Verification Page"
        subtitle_width = c.stringWidth(subtitle, "Helvetica", 18)
        c.drawString((width - subtitle_width) / 2, height - 180, subtitle)
        
        # Draw Center Box/Frame for QR
        box_size = 250
        box_x = (width - box_size) / 2
        box_y = (height - box_size) / 2 + 20
        
        # Shadow effects
        c.setFillColor(HexColor('#e6e6e6')) # Light gray
        c.rect(box_x + 5, box_y - 5, box_size, box_size, fill=True, stroke=False)
        
        # Main Box
        c.setFillColor(HexColor('#ffffff')) # White
        c.setStrokeColor(micromerit_blue)
        c.setLineWidth(2)
        c.rect(box_x, box_y, box_size, box_size, fill=True, stroke=True)
        
        # Generate QR Code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # ReportLab requires an ImageReader or path. We can use a temp buffer or PIL image.
        # It's easiest to save PIL image to a byte stream
        qr_byte_stream = io.BytesIO()
        qr_img.save(qr_byte_stream, format='PNG')
        qr_byte_stream.seek(0)
        
        # Place QR Code
        # ReportLab's drawImage accepts a filename or an ImageReader
        from reportlab.lib.utils import ImageReader
        qr_reader = ImageReader(qr_byte_stream)
        
        # Draw Image centered in box. Scale it to fit nicely.
        # qr_img is likely square.
        # Let's target 80% of box size = 200px
        target_qr_size = 200
        qr_x_pos = box_x + (box_size - target_qr_size) / 2
        qr_y_pos = box_y + (box_size - target_qr_size) / 2
        
        c.drawImage(qr_reader, qr_x_pos, qr_y_pos, width=target_qr_size, height=target_qr_size)
        
        # Instruction Text
        c.setFont("Helvetica", 12)
        c.setFillColor(HexColor('#4d4d4d'))
        instruction = "Scan this QR code to view the original document data."
        instruction_width = c.stringWidth(instruction, "Helvetica", 12)
        c.drawString((width - instruction_width) / 2, box_y - 40, instruction)
        
        # Footer
        c.setFont("Helvetica", 10)
        c.setFillColor(HexColor('#999999'))
        footer = "Powered by MicroMerit Portal"
        footer_width = c.stringWidth(footer, "Helvetica", 10)
        c.drawString((width - footer_width) / 2, 40, footer)
        
        c.save()
        packet.seek(0)
        return packet

    def append_qr_page(self, original_pdf_bytes: bytes, qr_data: str) -> bytes:
        """
        Appends the generated QR page to the original PDF
        """
        # Create QR page
        qr_page_stream = self.create_qr_page(qr_data)
        qr_pdf_reader = PdfReader(qr_page_stream)
        qr_page = qr_pdf_reader.pages[0]
        
        # Read original PDF
        original_pdf_stream = io.BytesIO(original_pdf_bytes)
        pdf_reader = PdfReader(original_pdf_stream)
        pdf_writer = PdfWriter()
        
        # Add all original pages
        for page in pdf_reader.pages:
            pdf_writer.add_page(page)
            
        # Add QR page
        pdf_writer.add_page(qr_page)
        
        # Write to output
        output_stream = io.BytesIO()
        pdf_writer.write(output_stream)
        return output_stream.getvalue()

pdf_service = PDFService()
