import groovy.json.JsonSlurper
import java.util.Base64

// Decode JWT payload to extract custom claims.
// JwtValidationFilter upstream already verified the RS256 signature,
// so we only need the payload here — no re-verification required.
def authHeader = request.headers.getFirst('Authorization')
def claims = [:]

if (authHeader?.startsWith('Bearer ')) {
    def token = authHeader.substring(7)
    def parts = token.split('\\.')
    if (parts.length >= 2) {
        try {
            // Pad to a multiple of 4 before decoding (Base64url has no padding)
            def padded = parts[1].padRight((parts[1].length() + 3) & ~3, '=')
            def payload = new String(Base64.urlDecoder.decode(padded), 'UTF-8')
            claims = new JsonSlurper().parseText(payload)
        } catch (Exception e) {
            logger.warn('inject-jwt-headers: failed to decode JWT payload — {}', e.message)
        }
    }
}

def userId = claims.sub ?: ''

// Inject standard and custom claims as headers for the Spring Boot backend
request.headers.put('X-User-ID',       [userId])
request.headers.put('X-User-Email',    [claims.email        ?: ''])
request.headers.put('X-Given-Name',    [claims.given_name   ?: ''])
request.headers.put('X-Family-Name',   [claims.family_name  ?: ''])
request.headers.put('X-User-Role',     [claims.role         ?: ''])
request.headers.put('X-Account-Tier',  [claims.account_tier ?: ''])

// Strip the original bearer token — backend uses headers, not the JWT
request.headers.remove('Authorization')

// Forward the request, then stamp session cookies onto the response
return next.handle(context, request).thenApply({ response ->
    response.headers.add('Set-Cookie',
        "cbo-session=${UUID.randomUUID()}; HttpOnly; SameSite=Strict; Path=/")
    response.headers.add('Set-Cookie',
        "cbo-user=${userId}; SameSite=Strict; Path=/")
    return response
})
