package pe.edu.utp.smartdent.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender javaMailSender;

    public EmailService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    public void enviarCorreo(String destinatario, String asunto, String cuerpoHtml) {
        try {
            MimeMessage mensaje = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensaje, true, "UTF-8");

            helper.setTo(destinatario);
            helper.setSubject(asunto);
            // El true indica que el cuerpo del mensaje es HTML
            helper.setText(cuerpoHtml, true);
            
            // Configura de quién viene el correo (tu cuenta admin)
            // helper.setFrom("tu_correo_admin@gmail.com"); 

            javaMailSender.send(mensaje);
        } catch (MessagingException e) {
            throw new RuntimeException("Error al enviar el correo a " + destinatario, e);
        }
    }
}
