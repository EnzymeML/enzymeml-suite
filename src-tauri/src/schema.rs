diesel::table! {
    documents (id) {
        id -> Int4,
        title -> Varchar,
        content -> Text,
    }
}