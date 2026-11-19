// Hacer interfaz para los datos de la funcion

// export function resolveTarget(userId, type, id) {}
// return (target, target_owner)

// REQUIREMENTS
// post, fragment and comment -> visible for the user by RLS
// message -> is_chat_member?
// user -> profile must exist
// reporting one's own content or profile is not allowed

// SECURIRTY
// Respond with 404 Not Fonud if can't view
// Take only the message reported, not the whole conversation

// TESTS
// visible post? -> ok
// blocked profile post? -> 404
// message form chat without user? -> 404
// own post? -> 400 CANNOT_REPORT_SELF
// Id does not exist -> 404