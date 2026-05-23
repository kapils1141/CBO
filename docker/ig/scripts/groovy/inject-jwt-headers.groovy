import groovy.json.JsonSlurper
import java.util.Base64
import org.forgerock.http.protocol.Request as HttpRequest

// Decode JWT payload (signature already verified by JwtValidationFilter upstream)
def authHeader = request.headers.getFirst('Authorization')
def token = ''
def jwtClaims = [:]

if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)

    def parts = token.split('\\.')

    if (parts.length >= 2) {
        try {
            def padded = parts[1].padRight((parts[1].length() + 3) & ~3, '=')

            def payload = new String(
                Base64.urlDecoder.decode(padded),
                'UTF-8'
            )

            jwtClaims = new JsonSlurper().parseText(payload)

        } catch (Exception e) {
            logger.warn(
                'inject-jwt-headers: JWT decode failed — {}',
                e.message
            )
        }
    }
}

def userId = jwtClaims.sub ?: ''

// Fetch full profile from AM UserInfo endpoint
def userInfoReq = new HttpRequest()

userInfoReq.method = 'GET'

userInfoReq.uri = new URI(
    'http://cbonline.lloyds.com:8080/openam/oauth2/userinfo'
)

userInfoReq.headers.put(
    'Authorization',
    [String.valueOf("Bearer ${token}")]
)

return http.send(context, userInfoReq).thenAsync({ userInfoResp ->

    def profile = jwtClaims

    if (userInfoResp.status.successful) {
        try {
            profile = new JsonSlurper().parseText(
                userInfoResp.entity.string
            )
        } catch (Exception e) {
            logger.warn(
                'inject-jwt-headers: UserInfo parse failed — {}',
                e.message
            )
        }
    } else {
        logger.warn(
            'inject-jwt-headers: UserInfo returned {} — using JWT claims only',
            userInfoResp.status.code
        )
    }

    // Safely extract role/account tier
    def roleValue = profile.role ?: jwtClaims.role ?: ''
    def tierValue = profile.account_tier ?: jwtClaims.account_tier ?: ''

    // Convert collections into comma-separated strings
    if (roleValue instanceof Collection) {
        roleValue = roleValue.join(',')
    }

    if (tierValue instanceof Collection) {
        tierValue = tierValue.join(',')
    }

    // DEBUG LOGGING
    logger.warn('userId type = {} value = {}',
        userId?.getClass()?.getName(),
        userId)

    logger.warn('email type = {} value = {}',
        profile.email?.getClass()?.getName(),
        profile.email)

    logger.warn('given_name type = {} value = {}',
        profile.given_name?.getClass()?.getName(),
        profile.given_name)

    logger.warn('family_name type = {} value = {}',
        profile.family_name?.getClass()?.getName(),
        profile.family_name)

    logger.warn('roleValue type = {} value = {}',
        roleValue?.getClass()?.getName(),
        roleValue)

    logger.warn('tierValue type = {} value = {}',
        tierValue?.getClass()?.getName(),
        tierValue)

    // Inject headers safely
    request.headers.put(
        'X-User-ID',
        [String.valueOf(userId ?: '')]
    )

    request.headers.put(
        'X-User-Email',
        [String.valueOf(profile.email ?: '')]
    )

    request.headers.put(
        'X-Given-Name',
        [String.valueOf(profile.given_name ?: '')]
    )

    request.headers.put(
        'X-Family-Name',
        [String.valueOf(profile.family_name ?: '')]
    )

    request.headers.put(
        'X-User-Role',
        [String.valueOf(roleValue ?: '')]
    )

    request.headers.put(
        'X-Account-Tier',
        [String.valueOf(tierValue ?: '')]
    )

    // Remove JWT before forwarding downstream
    request.headers.remove('Authorization')

    return next.handle(context, request)
})