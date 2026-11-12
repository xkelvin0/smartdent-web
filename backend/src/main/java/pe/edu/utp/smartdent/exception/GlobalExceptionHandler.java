package pe.edu.utp.smartdent.exception;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ApiError> manejarNoEncontrado(RecursoNoEncontradoException exception) {
        HttpStatus status = HttpStatus.NOT_FOUND;
        ApiError error = new ApiError(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                exception.getMessage(),
                Map.of());

        return ResponseEntity.status(status).body(error);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiError> manejarAutenticacion(AuthenticationException exception) {
        HttpStatus status = HttpStatus.UNAUTHORIZED;
        String mensaje = "El correo o la contraseña son incorrectos";
        if (exception instanceof org.springframework.security.authentication.DisabledException) {
            mensaje = "Tu cuenta aún no está activada. Revisa tu correo para verificarla.";
        }
        ApiError error = new ApiError(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                mensaje,
                Map.of());

        return ResponseEntity.status(status).body(error);
    }

    @ExceptionHandler(RecursoDuplicadoException.class)
    public ResponseEntity<ApiError> manejarDuplicado(RecursoDuplicadoException exception) {
        HttpStatus status = HttpStatus.CONFLICT;
        ApiError error = new ApiError(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                exception.getMessage(),
                Map.of());

        return ResponseEntity.status(status).body(error);
    }

    @ExceptionHandler(ReglaNegocioException.class)
    public ResponseEntity<ApiError> manejarReglaNegocio(ReglaNegocioException exception) {
        HttpStatus status = HttpStatus.UNPROCESSABLE_ENTITY;
        ApiError error = new ApiError(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                exception.getMessage(),
                Map.of());

        return ResponseEntity.status(status).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> manejarValidacion(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                fields.putIfAbsent(error.getField(), error.getDefaultMessage()));

        HttpStatus status = HttpStatus.BAD_REQUEST;
        ApiError error = new ApiError(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                "Revisa los datos enviados",
                fields);

        return ResponseEntity.badRequest().body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> manejarExcepcionGeneral(Exception exception) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String mensaje = "Ocurrió un error inesperado en el servidor";
        if (exception.getMessage() != null && exception.getMessage().contains("Error al enviar el correo")) {
            mensaje = "No se pudo enviar el correo de validación. Verifica que el correo sea válido o intenta más tarde.";
        }
        ApiError error = new ApiError(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                mensaje,
                Map.of());

        return ResponseEntity.status(status).body(error);
    }
}
